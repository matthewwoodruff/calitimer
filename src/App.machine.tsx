import {assign, EventObject, Machine} from "xstate";
import {StateSchema} from 'xstate/es';

interface Workout {
    time: number;
    state: 'Active' | 'Rest';
    complete: boolean;
    set: number;
}

interface Context {
    sets: number;
    active: number;
    rest: number;
    elapsedTime: number;
    previousTime: number,
    workout: Workout;
}

interface AppStateSchema extends EventObject {
    states: {
        idle: StateSchema;
        active: {
            states: {
                running: StateSchema
                paused: StateSchema
            }
        };
    };
}

type UpdateActiveEvent = { type: 'UPDATE_ACTIVE', data: number }
type UpdateSetsEvent = { type: 'UPDATE_SETS', data: number }

type Event =
    | UpdateSetsEvent
    | UpdateActiveEvent
    | { type: 'UPDATE_REST', data: number }
    | { type: 'START' }
    | { type: 'TOGGLE_START' }
    | { type: 'TOGGLE_PAUSE' }
    | { type: 'UPDATE_WORKOUT' }
    | { type: 'STOP' };

const buildStatus = (elapsedTime: number, active: number, sets: number, rest: number): Workout => {
    const setTime = active + rest;
    const timeIntoSet = elapsedTime % setTime
    const set = Math.floor((elapsedTime - rest) / setTime) + 1
    const inActivePhase = timeIntoSet >= rest;
    return {
        time: setTime - timeIntoSet - (inActivePhase ? 0 : active),
        state: inActivePhase ? 'Active' : 'Rest',
        complete: sets + 1 === set,
        set,
    }
}

export const calitimerMachine = Machine<Context, AppStateSchema, Event>({
    initial: 'idle',
    context: {
        sets: 15,
        active: 10000,
        rest: 20000,
        previousTime: 0,
        elapsedTime: 0,
        workout: buildStatus(0, 15, 10000, 20000)
    },
    states: {
        idle: {
            id: 'idle',
            on: {
                UPDATE_SETS: [{
                    actions: [assign((c, e) => ({sets: e.data}))],
                }],
                UPDATE_ACTIVE: [{
                    actions: [assign((c, e) => ({active: e.data}))],
                }],
                UPDATE_REST: [{
                    actions: [assign((c, e) => ({rest: e.data}))],
                }],
                TOGGLE_START: '#active',
            }
        },
        active: {
            id: 'active',
            initial: 'running',
            entry: assign((c, e) => ({elapsedTime: 0, previousTime: Date.now()})),
            states: {
                running: {
                    invoke: {
                        id: 'interval',
                        src: (context, event) => (callback, onReceive) => {
                            const id = setInterval(() => {
                                callback('UPDATE_WORKOUT')
                            }, 100);
                            return () => clearInterval(id);
                        }
                    },
                    on: {
                        TOGGLE_START: '#idle',
                        TOGGLE_PAUSE: 'paused',
                        UPDATE_WORKOUT: [{
                            actions: [
                                assign(context => {
                                    const now = Date.now();
                                    let elapsedTime = context.elapsedTime + now - context.previousTime;
                                    return {
                                        elapsedTime: elapsedTime,
                                        previousTime: now
                                    }
                                }),
                                assign({
                                    workout: context => buildStatus(
                                        context.elapsedTime,
                                        context.active,
                                        context.sets,
                                        context.rest,
                                    )
                                })
                            ]
                        }]
                    },
                },
                paused: {
                    on: {
                        TOGGLE_PAUSE: 'running',
                    }
                }
            },
        }
    }
})