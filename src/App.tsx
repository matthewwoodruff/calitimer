import React, {useEffect, useState} from 'react';
import moment from "moment";
import './App.css';

const interval = 1000;

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

const buildStatus = (currentTime: number, {active, rest, sets}: Activity): Status => {
    const setTime = active + rest;
    const remainder = currentTime % setTime
    const set = Math.floor(currentTime / setTime) + 1
    const inActivePhase = remainder <= active;
    return {
        time: active - remainder + (inActivePhase ? 0 : rest),
        state: inActivePhase ? 'Active' : 'Rest',
        complete: sets + 1 === set,
        set,
        next: (nextTime) => buildStatus(currentTime + nextTime, {active, rest, sets})
    }
}

const defaultActivity = {
    sets: 15,
    active: 10000,
    rest: 20000,
};

const defaultStatus = buildStatus(0, defaultActivity);

function App() {
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [activity, setActivity] = useState(defaultActivity)
    const [status, setStatus] = useState(defaultStatus);

    const inActivity = running || paused;

    const stop = () => {
        setStatus(defaultStatus);
        setPaused(false);
        setRunning(false);
    }

    useEffect(() => {
        if (status.complete) {
            stop();
            return;
        }

        if (running) {
            const intervalId = setTimeout(() => {
                setStatus(status => status.next(interval))
            }, interval);
            return () => clearTimeout(intervalId);
        }

        return;
    }, [running, status])

    const toggle = () => {
        if (inActivity) {
            stop();
        } else {
            setRunning(true);
        }
    }

    const updateActivity = (activity: Activity) => {
        setStatus(buildStatus(0, activity));
        setActivity(activity);
    }

    const togglePause = () => {
        setPaused(!paused);
        setRunning(!running);
    }

    const {active, rest, sets} = activity;

    const {time, state, set} = status;

    return (
        <div className={`App`}>
            <div className={`App-header ${inActivity ? state : ''}`}>
                <div className="Time">{moment(time).format("mm:ss")}</div>
                <div className="Set">{set}/{sets}</div>
            </div>
            <button onClick={toggle}>{inActivity ? 'Stop' : 'Start'}</button>
            {inActivity && <button onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>}
            {!inActivity && <>
                Sets <input type="number"
                            value={sets}
                            min={1}
                            onChange={e => updateActivity({sets: Number(e.target.value), active, rest})}/>
                Active <SecondsInput value={active} onChange={value => updateActivity({active: value, sets, rest})}/>
                Rest <SecondsInput value={rest} onChange={value => updateActivity({rest: value, active, sets})}/>
            </>}
        </div>
    );
}

export default App;
