const fs = require('fs');

/**
 * シミュレーションロジック (スキルなしの走破タイム)
 */
function runNoSkill(courseLength, baseMidSpeed, baseFinalSpeed, baseAccel, dt = 1 / 60) {
  let time = 0;
  let distance = 0;
  let currentSpeed = 0;
  const midPoint = (2 / 3) * courseLength;

  while (true) {
    const isFinal = distance >= midPoint;
    const topSpeed = isFinal ? baseFinalSpeed : baseMidSpeed;

    currentSpeed += baseAccel * dt;
    if (currentSpeed > topSpeed) {
      currentSpeed = topSpeed;
    }

    const nextDist = distance + currentSpeed * dt;
    if (nextDist >= courseLength) {
      const remain = courseLength - distance;
      const partialDt = remain / currentSpeed;
      time += partialDt;
      break;
    } else {
      distance = nextDist;
      time += dt;
    }
  }
  return time;
}

/**
 * スキルありの走破タイム
 */
function runWithSkill(
  courseLength,
  baseMidSpeed,
  baseFinalSpeed,
  baseAccel,
  skillRate,
  skills,
  distanceToTimeMap,
  dt = 1 / 60
) {
  const activeSkills = [];
  for (const skill of skills) {
    if (Math.random() < skillRate) {
      const triggerPoint = skill.start + (skill.end - skill.start) * Math.random();
      const startTime = distanceToTimeMap.find(entry => entry.dist >= triggerPoint)?.time;
      if (!startTime) continue;
      activeSkills.push({
        startTime,
        endTime: startTime + skill.baseDuration,
        topSpeedBonus: skill.topSpeedBonus,
        accelBonus: skill.accelBonus,
        currentSpeedBonus: skill.currentSpeedBonus,
      });
    }
  }

  let time = 0;
  let distance = 0;
  let currentSpeed = 0;
  const midPoint = (2 / 3) * courseLength;

  while (true) {
    let activeTopSpeedBonus = 0;
    let activeAccelBonus = 0;

    for (const active of activeSkills) {
      if (active.startTime <= time && time < active.endTime) {
        activeTopSpeedBonus += active.topSpeedBonus ?? 0;
        activeAccelBonus += active.accelBonus ?? 0;
        currentSpeed += active.currentSpeedBonus ?? 0;
      }
    }

    const isFinal = distance >= midPoint;
    const baseTopSpeed = isFinal ? baseFinalSpeed : baseMidSpeed;
    const topSpeed = baseTopSpeed + activeTopSpeedBonus;

    currentSpeed += (baseAccel + activeAccelBonus) * dt;
    if (currentSpeed > topSpeed) {
      currentSpeed = topSpeed;
    }

    const nextDist = distance + currentSpeed * dt;
    if (Number.isNaN(nextDist)) {
      throw new Error('nextDist is NaN. distance: ' + distance + ', currentSpeed: ' + currentSpeed + ', dt: ' + dt);
    }
    if (nextDist >= courseLength) {
      const remain = courseLength - distance;
      const partialDt = remain / currentSpeed;
      time += partialDt;
      break;
    } else {
      distance = nextDist;
      time += dt;
    }
  }
  return time;
}

/**
 * 距離→時刻対応表を作成
 */
function createDistanceToTimeMap(courseLength, baseMidSpeed, baseFinalSpeed, baseAccel, dt = 1 / 60) {
  const map = [];
  let time = 0;
  let distance = 0;
  let currentSpeed = 0;
  const midPoint = (2 / 3) * courseLength;

  while (distance < courseLength) {
    const isFinal = distance >= midPoint;
    const topSpeed = isFinal ? baseFinalSpeed : baseMidSpeed;

    currentSpeed += baseAccel * dt;
    if (currentSpeed > topSpeed) currentSpeed = topSpeed;

    distance += currentSpeed * dt;
    time += dt;

    map.push({ dist: distance, time });
  }
  return map;
}

/**
 * シミュレーションの集計結果を計算
 */
function aggregateResults(results, percentileValues) {
  const sortedResults = [...results].sort((a, b) => b - a); // 降順ソート
  const percentiles = percentileValues.map(percentile => {
    const index = Math.floor((percentile / 100) * sortedResults.length);
    return {
      percentile,
      value: sortedResults[index] || 0,
    };
  });

  return percentiles;
}

/**
 * メインシミュレーション関数
 */
function simulate(input, percentiles = [90, 95, 99]) {
  const {
    courseLength,
    baseMidSpeed,
    baseFinalSpeed,
    baseAccel,
    skillRate,
    trials,
    skills,
  } = input;

  const distanceToTimeMap = createDistanceToTimeMap(courseLength, baseMidSpeed, baseFinalSpeed, baseAccel);
  const noSkillTime = runNoSkill(courseLength, baseMidSpeed, baseFinalSpeed, baseAccel);

  const results = [];
  for (let i = 0; i < trials; i++) {
    const withSkillTime = runWithSkill(courseLength, baseMidSpeed, baseFinalSpeed, baseAccel, skillRate, skills, distanceToTimeMap);
    results.push(noSkillTime - withSkillTime);
  }

  return aggregateResults(results, percentiles);
}

/**
 * 複数ファイルの結果を比較
 */
function compareSimulations(files, percentiles) {
  const results = files.map(file => {
    const inputData = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const simulationResults = simulate(inputData, percentiles);
    return { file, simulationResults };
  });

  // 結果を表示
  console.log('\n=== シミュレーション結果 ===');
  console.log(' file_name           | ' + percentiles.map(p => `${p}%`.padStart(6)).join(' | '));
  console.log('----------------------------------------------');
  results.forEach(({ file, simulationResults }) => {
    const values = simulationResults.map(({ value }) => value.toFixed(3).padStart(6));
    console.log(`${file.padEnd(20)} | ${values.join(' | ')}`);
  });
  console.log('==============================================\n');
}

/**
 * 実行部
 */
const inputFiles = process.argv.slice(2);
if (inputFiles.length === 0) {
  console.error('Usage: node simulation.js <inputFile1> <inputFile2> ...');
  process.exit(1);
}

const percentiles = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]; // 見たいパーセンタイル
compareSimulations(inputFiles, percentiles);
