import { getStore } from '@netlify/blobs';
import { act, addPlayer, newState, type GameState } from '../../src/game-core.js';

type RoomRecord = { state: GameState; createdAt: string };
const store = getStore({ name: 'chemistry-lab-rooms', consistency: 'strong' });
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), { status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'} });
const id = () => crypto.randomUUID().replaceAll('-','').slice(0,10);
const roomKey = (code:string) => `room:${code.toUpperCase()}`;
async function readRoom(code:string){ const entry=await store.getWithMetadata(roomKey(code),{consistency:'strong',type:'json'}); if(!entry) return null; return { record:entry.data as RoomRecord, etag:entry.etag }; }
async function writeRoom(code:string,record:RoomRecord,etag?:string){ const opts=etag?{onlyIfMatch:etag}:{onlyIfNew:true}; return store.setJSON(roomKey(code),record,opts); }
async function mutate(code:string, fn:(r:RoomRecord)=>RoomRecord){
  for(let attempt=0;attempt<5;attempt++){
    const current=await readRoom(code); if(!current) throw new Error('Lab not found.');
    const updated=fn(structuredClone(current.record));
    const result=await writeRoom(code,updated,current.etag);
    if(result.modified) return updated;
  }
  throw new Error('The lab changed at the same time. Please try again.');
}
function publicRecord(r:RoomRecord){ return {state:r.state}; }

export default async function handler(req:Request){
  if(req.method==='GET') return json({ok:true,service:'chemistry-lab-escape',function:'game'});
  if(req.method!=='POST') return json({error:'POST only'},405);
  try{
    const body=await req.json(); const action=String(body.action||'');
    if(action==='create'){
      const name=String(body.name||'Scientist').trim().slice(0,18)||'Scientist';
      for(let i=0;i<8;i++){
        const code=`CHEM-${Math.floor(1000+Math.random()*9000)}`;
        const state=newState(); state.players.push({id:id(),name,score:0});
        const result=await writeRoom(code,{state,createdAt:new Date().toISOString()});
        if(result.modified) return json({ok:true,code,playerId:state.players[0].id,state});
      }
      return json({error:'Could not create a unique lab. Try again.'},503);
    }
    const code=String(body.code||'').trim().toUpperCase(); if(!/^CHEM-\d{4}$/.test(code)) return json({error:'Enter a valid lab code like CHEM-1234.'},400);
    if(action==='join'){
      const playerId=id(); const name=String(body.name||'Scientist').trim().slice(0,18)||'Scientist';
      const state=await mutate(code,r=>{ if(r.state.phase!=='lobby') throw new Error('This lab has already started.'); return {...r,state:addPlayer(r.state,{id:playerId,name,score:0})}; });
      return json({ok:true,code,playerId,state:state.state});
    }
    if(action==='get'){ const room=await readRoom(code); if(!room) return json({error:'Lab not found.'},404); return json({ok:true,code,...publicRecord(room.record)}); }
    if(action==='act'){
      const playerId=String(body.playerId||''); if(!playerId) return json({error:'Missing player.'},400);
      const next=await mutate(code,r=>({...r,state:act(r.state,playerId,actionName(body),body)}));
      return json({ok:true,code,...publicRecord(next)});
    }
    return json({error:'Unknown action.'},400);
  }catch(error){ return json({error:error instanceof Error?error.message:'Unexpected error.'},400); }
}
function actionName(body:any){ if(body.type==='start') return 'start'; if(body.type==='round1') return 'round1'; if(body.type==='round2') return 'round2'; if(body.type==='round3') return 'round3'; return String(body.type||''); }
