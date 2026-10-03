export type Player = { id: string; name: string; score: number };
export type GameState = {
  phase: 'lobby' | 'playing' | 'finished';
  round: 0 | 1 | 2 | 3;
  players: Player[];
  completedBy: Record<string, boolean>;
  mixture: string;
  message: string;
  winnerId: string | null;
};
export const ROUND_POINTS = [0, 10, 20, 30] as const;
export function newState(): GameState { return { phase:'lobby', round:0, players:[], completedBy:{}, mixture:'', message:'Welcome, young scientists! Create a lab and invite a friend.', winnerId:null }; }
export function addPlayer(state: GameState, player: Player): GameState { if(state.players.length>=4) throw new Error('This lab is full.'); return {...state,players:[...state.players,player]}; }
export function startGame(state: GameState): GameState { if(state.phase!=='lobby') return state; if(state.players.length<1) throw new Error('At least one scientist is needed.'); return {...state,phase:'playing',round:1,completedBy:{},message:'Round 1: turn on the lab lights. Enter the code 246.'}; }
function allDone(state: GameState){ return state.players.length>0 && state.players.every(p=>state.completedBy[p.id]); }
function markAndAdvance(state: GameState, playerId: string, points: number, mixture: string, completeMessage: string, nextRound: 1|2|3): GameState {
  const completedBy={...state.completedBy,[playerId]:true};
  const bonus=Object.keys(state.completedBy).length===0?5:0;
  const players=state.players.map(p=>p.id===playerId?{...p,score:p.score+points+bonus}:p);
  let next:GameState={...state,players,completedBy,mixture,message:`${pname(players,playerId)} completed the round and earned ${points+bonus} points! ${bonus?'⚡ First-finish bonus! ':''}${allDone({...state,completedBy})?'': 'Waiting for the other scientist…'}`};
  if(allDone(next)) next={...next,round:nextRound,completedBy:{},message:completeMessage};
  return next;
}
function pname(players:Player[],id:string){return players.find(p=>p.id===id)?.name??'Scientist';}
export function act(state:GameState,playerId:string,action:string,payload:any):GameState{
  if(!state.players.some(p=>p.id===playerId)) throw new Error('Scientist not found.');
  if(action==='start') return startGame(state);
  if(state.phase!=='playing') throw new Error('The game is not accepting actions right now.');
  if(state.completedBy[playerId]) throw new Error('You already completed this round. Wait for your teammate.');
  if(action==='round1'){
    if(state.round!==1||String(payload?.answer??'').trim()!=='246') throw new Error('Use the blue bottle clue: 246.');
    return markAndAdvance(state,playerId,10,'Lights On','Round 1 complete! 💡 Both scientists: Round 2 is BLUE + YELLOW.',2);
  }
  if(action==='round2'){
    if(state.round!==2) throw new Error('Round 2 is not active.');
    const c=Array.isArray(payload?.chemicals)?payload.chemicals:[]; const good=c.length===2&&new Set(c).size===2&&c.includes('Blue')&&c.includes('Yellow');
    if(!good) throw new Error('The first recipe is BLUE + YELLOW.');
    return markAndAdvance(state,playerId,20,'Green Glow','Round 2 complete! 🌈 Both scientists: Round 3 is GREEN + RED.',3);
  }
  if(action==='round3'){
    if(state.round!==3) throw new Error('Round 3 is not active.');
    const c=Array.isArray(payload?.chemicals)?payload.chemicals:[]; const good=c.length===2&&new Set(c).size===2&&c.includes('Green')&&c.includes('Red');
    if(!good) throw new Error('The final recipe is GREEN + RED.');
    const completedBy={...state.completedBy,[playerId]:true};
    const bonus=Object.keys(state.completedBy).length===0?5:0;
    const players=state.players.map(p=>p.id===playerId?{...p,score:p.score+30+bonus}:p);
    const next={...state,players,completedBy,mixture:'Purple Spark'};
    if(allDone(next)){
      const sorted=[...players].sort((a,b)=>b.score-a.score); const winner=sorted[0].score===sorted[1]?.score?players.find(p=>p.id===playerId)!:sorted[0];
      return {...next,phase:'finished',message:`Purple Spark created! ✨ ${winner.name} wins with ${winner.score} points! 🏆`,winnerId:winner.id};
    }
    return {...next,message:`${pname(players,playerId)} completed Round 3 and earned ${30+bonus} points! ${bonus?'⚡ First-finish bonus! ':''}Waiting for the other scientist…`};
  }
  throw new Error('Unknown game action.');
}
