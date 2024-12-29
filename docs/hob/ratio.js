const rand = (min, max) => min === max ? min : (Math.random() * (max - min) + min);

/**
 * Main function to calculate the cumulative distribution
 * @param {number[][]} s
 * @param {number} rate
 * @param {string} label
 * @param {function} filter
 * @param {object} successRange
 * @returns {object} Cumulative distribution result
 */
function calculateCumulativeDistribution(s, rate, label, filter, successRange) {
  const n = 100 * 10000;
  const result = {};
  for(let i = successRange.min; i <= successRange.max; i++){
    result[i] = 0;
  }


  for (let i = 0; i < n; i++) {
    let points = [];

    for (const p of s) {
      points.push(Math.random() < rate ? rand(p[0], p[1]) : null);
    }

    points = points.filter(p => p !== null);
    points.sort((a, b) => a - b);

    const key = Math.floor((points[2] ?? 0));
    if(!filter(key)) {
      continue;
    }

    if (!(key in result)) {
      result[key] = 0;
    }
    result[key]++;
  }
  delete result[0];

  const sortedKeys = Object.keys(result).map(k => Number.parseFloat(k)).sort((a, b) => a - b);
  const cumulativeResult = [];
  let cumulativeSum = 0;
  for (const key of sortedKeys) {
    cumulativeSum += result[key];
    cumulativeResult.push({ x: key, y: cumulativeSum / n });
  }
  return { label, data: cumulativeResult };
}

// Visualization using Chart.js
document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('successRate').getContext('2d');
  const rate = Number.parseFloat(document.getElementById('スキル発動率').value);
  const l = Number.parseInt(document.getElementById('コース長').value);
  const skillList = [
    [l * 1 / 6, l * 2 / 3], // rand
    [l * 1 / 6, l * 2 / 3], // rand
    [l * 2 / 3, l * 2 / 3], // rand
  ];
  const 接続扱い残持続秒数 = Number.parseFloat(document.getElementById('接続とみなすのに残す持続秒数').value);

  const successRange = { min: l * 2 / 3 - 20 * (5 * l /1000 - 接続扱い残持続秒数), max: l * 2 / 3 + 100 };
  const filter = (v) => successRange.min <= v && v <= successRange.max;
  const data1 = calculateCumulativeDistribution(skillList, rate, 'Dataset 1', filter, successRange);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...new Set([...data1.data.map(r => r.x)])]
        .sort((a, b) => a - b),
      datasets: [
        {
          label: data1.label,
          data: data1.data.map(r => r.y),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: true,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Value of Points[2]',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Cumulative Frequency',
          },
        },
      },
    },
  });
});
