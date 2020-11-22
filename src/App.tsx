import React from 'react';
import moment from "moment";
import {useMachine} from '@xstate/react';
import './App.css';
import {calitimerMachine} from './App.machine';

interface InputProps {
    value: number;
    onChange: (a: number) => void;
}

interface Activity {
    sets: number;
    active: number;
    rest: number;
}

interface Status {
    elapsedTime: number;
    time: number;
    state: 'Active' | 'Rest';
    set: number;
    complete: boolean;
    next: (time: number) => Status;
}

function SecondsInput({value, onChange}: InputProps) {
    return (
        <input type="number"
               value={value / 1000}
               min={1}
               onChange={e => onChange(Number(e.target.value) * 1000)}/>
    )
}

function App() {

    const [current, send] = useMachine(calitimerMachine);

    const {active, rest, sets, elapsedTime, workout} = current.context;

    const {time, state, set} = workout;

    const inActivity = current.matches('active');
    const paused = current.matches('active.paused');
    return (
        <div className={`App`}>
            <div className={`App-header ${inActivity ? state : ''}`}>
                <code className="Time">{moment(time).format("mm:ss")}</code>
                <code className="Set">{moment(elapsedTime).format("mm:ss")}</code>
                <code className="Set">{set}/{sets}</code>
                <div className="controls">
                    <div className="buttons">
                        <button onClick={() => send('TOGGLE_START')}>{inActivity ? 'Stop' : 'Start'}</button>
                        {inActivity && <button onClick={() => send('TOGGLE_PAUSE')}>{paused ? 'Resume' : 'Pause'}</button>}
                    </div>
                    {!inActivity && <>
                        Sets <input type="number"
                                    value={sets}
                                    min={1}
                                    onChange={e => send({type: 'UPDATE_SETS', data: Number(e.target.value)})}/>
                        Active <SecondsInput value={active} onChange={data => send({type: 'UPDATE_ACTIVE', data})}/>
                        Rest <SecondsInput value={rest} onChange={data => send({type: 'UPDATE_REST', data})}/>
                    </>}
                </div>
            </div>

        </div>
    );
}

export default App;
