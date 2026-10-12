/**
 * Utility for normalizing names (removing extra whitespace, lowercasing)
 */
export function normalizeName(name) {
  if (!name) return '';
  return name.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parses dd/mm/yyyy date string to UTC Date object safely
 */
export function parseArrivalDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
  }
  return new Date(dateStr);
}

/**
 * Calculates percentage change between the latest price and the previous price.
 * Records must be sorted chronologically.
 */
export function calculatePriceChangePercentage(records) {
  if (!records || records.length < 2) return null;
  const latestPrice = records[records.length - 1].modal_price;
  const prevPrice = records[records.length - 2].modal_price;
  if (!prevPrice || prevPrice === 0) return null;
  const change = ((latestPrice - prevPrice) / prevPrice) * 100;
  return Number(change.toFixed(2));
}

/**
 * Generates a 4-week price forecast curve using linear regression.
 * Returns [currentPrice, week1, week2, week3] if records >= 3.
 * Otherwise returns null.
 */
export function calculateLinearRegressionForecast(records) {
  if (!records || records.length < 3) return null;

  const latestPrice = records[records.length - 1].modal_price;
  const t0 = new Date(records[0].arrival_date).getTime();
  
  // Convert dates to days from the first record
  const xs = records.map(r => (new Date(r.arrival_date).getTime() - t0) / (24 * 60 * 60 * 1000));
  const ys = records.map(r => r.modal_price);
  const n = records.length;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }

  const denominator = (n * sumXX - sumX * sumX);
  // Prevent division by zero if all records have the same date
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;

  // We project values for week +1 (7 days), week +2 (14 days), week +3 (21 days) relative to latest record
  const w1 = Math.round(latestPrice + slope * 7);
  const w2 = Math.round(latestPrice + slope * 14);
  const w3 = Math.round(latestPrice + slope * 21);

  // Cap prices at a minimum of 0
  return [
    latestPrice,
    Math.max(0, w1),
    Math.max(0, w2),
    Math.max(0, w3)
  ];
}

/**
 * Calculates advisor recommendation based on projected weekly price trend.
 * Returns 'Sell Later', 'Hold', 'Sell Soon', or 'Recommendation Unavailable'.
 */
export function calculateAdvisorRecommendation(records) {
  if (!records || records.length < 2) return 'Recommendation Unavailable';

  const forecast = calculateLinearRegressionForecast(records);
  if (!forecast) {
    // If not enough records for linear regression, check simple direction of change
    const latestPrice = records[records.length - 1].modal_price;
    const prevPrice = records[records.length - 2].modal_price;
    if (latestPrice > prevPrice) return 'Hold';
    if (latestPrice < prevPrice) return 'Sell Soon';
    return 'Hold';
  }

  const latestPrice = forecast[0];
  const w1Price = forecast[1];
  if (latestPrice === 0) return 'Hold';

  const weeklyChangePct = ((w1Price - latestPrice) / latestPrice) * 100;

  if (weeklyChangePct > 2.0) {
    return 'Sell Later';
  } else if (weeklyChangePct < -2.0) {
    return 'Sell Soon';
  } else {
    return 'Hold';
  }
}

/**
 * Calculates standard deviation of chronological price changes to gauge risk.
 * Returns 'Low Risk', 'Medium Risk', 'High Risk', or 'Risk Data Unavailable'.
 */
export function calculatePriceRisk(records) {
  if (!records || records.length < 3) return 'Risk Data Unavailable';

  let changes = [];
  for (let i = 1; i < records.length; i++) {
    const p1 = records[i - 1].modal_price;
    const p2 = records[i].modal_price;
    if (p1 > 0) {
      changes.push(((p2 - p1) / p1) * 100);
    }
  }

  if (changes.length < 2) return 'Risk Data Unavailable';

  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 1.5) {
    return 'Low Risk';
  } else if (stdDev > 4.0) {
    return 'High Risk';
  } else {
    return 'Medium Risk';
  }
}
