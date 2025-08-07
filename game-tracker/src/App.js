import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

const spelers = [
  'nyo',
  'nand',
  'jori',
  'bas',
  'karel',
  'kwinten',
  'stef',
  'yarne',
  'younes',
];

const initialData = {
  townHall: 1,
  mine: 0,
  farm: 0,
  animalFarm: 0,
  lumber: 0,
  armyCamp: 0,
  resources: {
    food: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    animal: 0,
  },
  armies: 0,
  lastUpdateTime: Date.now(),
};

function App() {
  const [spelersData, setSpelersData] = useState(
    spelers.map(() => ({ ...initialData }))
  );
  const [simulatedTime, setSimulatedTime] = useState(Date.now());

  // Timer state for all players (shared)
  const [timeLeftLabel, setTimeLeftLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  // Update gebouw levels
  const updateBuildingLevel = (index, building, delta) => {
    setSpelersData((prev) =>
      prev.map((data, i) => {
        if (i !== index) return data;
        const minLevel = building === 'townHall' ? 1 : 0;
        const newLevel = Math.max(minLevel, data[building] + delta);
        return { ...data, [building]: newLevel };
      })
    );
  };

  // Update leger
  const updateArmies = (index, delta) => {
    setSpelersData((prev) =>
      prev.map((data, i) => {
        if (i !== index) return data;
        const newArmies = Math.max(0, data.armies + delta);
        return { ...data, armies: newArmies };
      })
    );
  };

  // Update resource handmatig
  const updateResource = (index, resource, delta) => {
    setSpelersData((prev) =>
      prev.map((data, i) => {
        if (i !== index) return data;
        const newAmount = Math.max(0, (data.resources[resource] || 0) + delta);
        return {
          ...data,
          resources: {
            ...data.resources,
            [resource]: newAmount,
          },
        };
      })
    );
  };

  // Simuleer 15 minuten vooruit via knop
  const simulate15Minutes = () => {
    setSimulatedTime((prevSimTime) => prevSimTime + 15 * 60 * 1000);
  };

  // Automatische update van simulatedTime elke seconde, tenzij gepauzeerd
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setSimulatedTime((prev) => prev + 1000); // elke seconde vooruit
    }, 1000);
    return () => clearInterval(interval);
  }, [paused]);

  // Update resources als simulatedTime verandert
  useEffect(() => {
    setSpelersData((prev) =>
      prev.map((data) => {
        const now = simulatedTime;
        let elapsedMs = now - data.lastUpdateTime;
        const blocks15 = Math.floor(elapsedMs / (15 * 60 * 1000));
        if (blocks15 < 1) return data; // minder dan 15 min, niks doen

        return {
          ...data,
          resources: {
            food: data.resources.food + data.farm * blocks15,
            wood: data.resources.wood + data.lumber * blocks15,
            stone: data.resources.stone + data.mine * blocks15,
            iron: data.resources.iron + (data.mine >= 2 ? blocks15 : 0),
            animal: data.resources.animal + data.animalFarm * blocks15,
          },
          lastUpdateTime: data.lastUpdateTime + blocks15 * 15 * 60 * 1000,
        };
      })
    );
  }, [simulatedTime]);

  // Synchronized timer logic for all players (always counts down)
  useEffect(() => {
    // Use the first player's data as reference (all timers are the same)
    const data = spelersData[0];
    if (!data) return;
    const elapsed = simulatedTime - data.lastUpdateTime;
    const msInQuarter = 15 * 60 * 1000;
    const msInHalfHour = 30 * 60 * 1000;

    // Always show countdown to next 15 min and 30 min block
    const next15 =
      msInQuarter -
      (elapsed % msInQuarter === 0 ? msInQuarter : elapsed % msInQuarter);
    const next30 =
      msInHalfHour -
      (elapsed % msInHalfHour === 0 ? msInHalfHour : elapsed % msInHalfHour);

    // Timer always counts down to the next 15-min block
    let timeToNextUpdate = Math.min(next15, next30);

    // Progress percentage for the bar (use 15-min block for progress)
    let prog = ((msInQuarter - next15) / msInQuarter) * 100;
    setProgress(prog);

    // Format timer label mm:ss
    const secLeft = Math.floor(timeToNextUpdate / 1000);
    const min = Math.floor(secLeft / 60);
    const sec = secLeft % 60;
    setTimeLeftLabel(`${min}m ${sec.toString().padStart(2, '0')}s`);
  }, [simulatedTime, spelersData]);

  return (
    <div className="app-container">
      <Router>
        <h1 className="home-title">Evolutiespel Hernieuwers</h1>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <button onClick={simulate15Minutes} className="simulate-button">
            ⏩ Simuleer 15 minuten
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="simulate-button"
            style={{ marginLeft: 10 }}
          >
            {paused ? '▶️ Hervat timer' : '⏸️ Pauzeer timer'}
          </button>
        </div>

        <Routes>
          <Route
            path="/"
            element={<Home spelers={spelers} spelersData={spelersData} />}
          />
          {spelers.map((speler, index) => (
            <Route
              key={index}
              path={`/speler/${index}`}
              element={
                <SpelerDetail
                  id={index}
                  name={speler}
                  data={spelersData[index]}
                  updateBuildingLevel={(building, delta) =>
                    updateBuildingLevel(index, building, delta)
                  }
                  updateArmies={(delta) => updateArmies(index, delta)}
                  updateResource={(resource, delta) =>
                    updateResource(index, resource, delta)
                  }
                  simulatedTime={simulatedTime}
                  timeLeftLabel={timeLeftLabel}
                  progress={progress}
                />
              }
            />
          ))}
        </Routes>
      </Router>
    </div>
  );
}

function Home({ spelers }) {
  return (
    <div className="home-container">
      <div className="speler-button-container">
        {spelers.map((speler, index) => (
          <Link key={index} to={`/speler/${index}`} className="speler-button">
            {speler}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SpelerDetail({
  id,
  name,
  data,
  updateBuildingLevel,
  updateArmies,
  updateResource,
  simulatedTime,
  timeLeftLabel,
  progress,
}) {
  return (
    <div className="speler-detail-container">
      <h2 className="speler-detail-title">{name}</h2>

      <div className="timer-container">
        <div className="timer-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="timer-label">Volgende resources in: {timeLeftLabel}</div>

      <div className="detail-item">
        <strong>Town Hall:</strong> Level {data.townHall}{' '}
        <button
          className="level-button"
          onClick={() => updateBuildingLevel('townHall', 1)}
        >
          +
        </button>
        <button
          className="level-button"
          onClick={() => updateBuildingLevel('townHall', -1)}
          disabled={data.townHall <= 1}
        >
          −
        </button>
      </div>
      {['farm', 'lumber', 'animalFarm', 'mine', 'armyCamp'].map((building) => (
        <div key={building} className="detail-item">
          <strong>{capitalize(building)}:</strong> Level {data[building]}{' '}
          <button
            className="level-button"
            onClick={() => updateBuildingLevel(building, 1)}
          >
            +
          </button>
          <button
            className="level-button"
            onClick={() => updateBuildingLevel(building, -1)}
            disabled={data[building] <= 0}
          >
            −
          </button>
        </div>
      ))}

      <hr className="separator" />

      <div className="detail-item">
        <strong>Legers:</strong> {data.armies}{' '}
        <button className="level-button" onClick={() => updateArmies(1)}>
          +
        </button>
        <button
          className="level-button"
          onClick={() => updateArmies(-1)}
          disabled={data.armies <= 0}
        >
          −
        </button>
      </div>

      <hr className="separator" />

      {Object.entries(data.resources).map(([resource, amount]) => (
        <div key={resource} className="detail-item">
          <strong>{capitalize(resource)}:</strong> {amount}{' '}
          <button
            className="level-button"
            onClick={() => updateResource(resource, 1)}
          >
            +
          </button>
          <button
            className="level-button"
            onClick={() => updateResource(resource, -1)}
            disabled={amount <= 0}
          >
            −
          </button>
        </div>
      ))}

      <Link to="/" className="back-link">
        ← Terug naar overzicht
      </Link>
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default App;
