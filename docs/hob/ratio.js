const rand = (min, max) => min === max ? min : (Math.random() * (max - min) + min);

/**
 * Main function to calculate the cumulative distribution
 * @param {number[][]} s
 * @param {number} rate
 * @param {string} label
 * @returns {object} Cumulative distribution result
 */
function calculateCumulativeDistribution(s, rate, label) {
  const n = 100 * 10000;
  const result = {};
  for (let i = 0; i < n; i++) {
    let points = [];

    for (const p of s) {
      points.push(Math.random() < rate ? rand(p[0], p[1]) : null);
    }

    points = points.filter(p => p !== null);
    points.sort((a, b) => a - b);

    const key = Math.floor(points[2] ?? 0);
    if (!(key in result)) {
      result[key] = 0;
    }
    result[key]++;
  }
  delete result[0];

  const sortedKeys = Object.keys(result).map(k => parseFloat(k)).sort((a, b) => a - b);
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
  const rate = 0.928;
  const l = 2500;

  const s1 = [
    [l * 2 / 3, l * 2 / 3],
    [l * 2 / 3 + 30, l * 2 / 3 + 30],
    [l * 2 / 3, l * 5 / 6],
    [l * 2 / 3, l * 5 / 6],
    [l * 2 / 3, l * 2 / 3 + l * 1 / 12],
    [l * 2 / 3, l * 5 / 6],
  ];

  const s2 = [
    [l * 2 / 3, l * 2 / 3],
    [l * 2 / 3 + 30, l * 2 / 3 + 30],
    [l * 2 / 3, l * 5 / 6],
    [l * 2 / 3, l * 5 / 6],
    [l * 2 / 3, l * 2 / 3 + l * 1 / 12],
    // [l * 2 / 3, l * 5 / 6],
    [l - 777, l - 777],
  ];
  const s3 = [
    [l * 2 / 3, l * 2 / 3],
    [l * 2 / 3 + 30, l * 2 / 3 + 30],
    [l * 2 / 3, l * 5 / 6],
    [l * 2 / 3, l * 5 / 6],
    [l * 2 / 3, l * 2 / 3 + l * 1 / 12],
  ];

  const data1 = calculateCumulativeDistribution(s1, rate, 'Dataset 1');
  const data2 = calculateCumulativeDistribution(s2, rate, 'Dataset 2');
  const data3 = calculateCumulativeDistribution(s3, rate, 'Dataset 3');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: [...new Set([...data1.data.map(r => r.x), ...data2.data.map(r => r.x)])].sort((a, b) => a - b),
      datasets: [
        {
          label: data1.label,
          data: data1.data.map(r => r.y),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: true,
        },
        {
          label: data2.label,
          data: data2.data.map(r => r.y),
          backgroundColor: 'rgba(192, 75, 75, 0.2)',
          borderColor: 'rgba(192, 75, 75, 1)',
          borderWidth: 1,
          fill: true,
        },
        {
          label: data3.label,
          data: data3.data.map(r => r.y),
          backgroundColor: 'rgba(75, 75, 192, 0.2)',
          borderColor: 'rgba(75, 75, 192, 1)',
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
