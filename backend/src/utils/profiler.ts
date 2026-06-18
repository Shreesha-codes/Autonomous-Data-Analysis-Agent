export interface IColumnProfile {
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  nullCount: number;
  nullRate: number;
  uniqueCount: number;
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    outliersCount: number;
  };
  anomalies: string[];
}

export interface IDatasetProfile {
  rowCount: number;
  columnCount: number;
  columns: IColumnProfile[];
}

const isNumeric = (val: any): boolean => {
  if (typeof val === 'number') return !isNaN(val);
  if (typeof val === 'string' && val.trim() !== '') {
    return !isNaN(Number(val));
  }
  return false;
};

const isBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === 'false';
  }
  return false;
};

const isDateString = (val: any): boolean => {
  if (val instanceof Date) return true;
  if (typeof val === 'string' && val.trim() !== '') {
    const d = new Date(val);
    return !isNaN(d.getTime()) && val.includes('-'); // Simple date format guard
  }
  return false;
};

export const profileDataset = (data: Record<string, any>[]): IDatasetProfile => {
  const rowCount = data.length;
  if (rowCount === 0) {
    return { rowCount: 0, columnCount: 0, columns: [] };
  }

  const keys = Object.keys(data[0]);
  const columnCount = keys.length;

  const columns: IColumnProfile[] = keys.map((key) => {
    const rawValues = data.map((row) => row[key]);
    const nonNullValues = rawValues.filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
    const nullCount = rowCount - nonNullValues.length;
    const nullRate = rowCount > 0 ? nullCount / rowCount : 0;

    // Type detection
    let dataType: 'string' | 'number' | 'boolean' | 'date' = 'string';
    if (nonNullValues.length > 0) {
      if (nonNullValues.every(isNumeric)) {
        dataType = 'number';
      } else if (nonNullValues.every(isBoolean)) {
        dataType = 'boolean';
      } else if (nonNullValues.every(isDateString)) {
        dataType = 'date';
      }
    }

    // Unique count
    const uniqueValues = new Set(nonNullValues.map((v) => String(v).trim()));
    const uniqueCount = uniqueValues.size;

    const anomalies: string[] = [];
    if (nullRate > 0.4) {
      anomalies.push(`High missing values rate (${(nullRate * 100).toFixed(1)}%)`);
    }

    // Calculate numerical statistics
    let stats: IColumnProfile['stats'] | undefined;
    if (dataType === 'number' && nonNullValues.length > 0) {
      const numbers = nonNullValues.map((v) => Number(v)).sort((a, b) => a - b);
      const min = numbers[0];
      const max = numbers[numbers.length - 1];
      const sum = numbers.reduce((acc, curr) => acc + curr, 0);
      const mean = sum / numbers.length;

      // Median
      const mid = Math.floor(numbers.length / 2);
      const median = numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;

      // IQR Outlier Detection
      const q1Index = Math.floor(numbers.length * 0.25);
      const q3Index = Math.floor(numbers.length * 0.75);
      const q1 = numbers[q1Index];
      const q3 = numbers[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const outliers = numbers.filter((n) => n < lowerBound || n > upperBound);
      const outliersCount = outliers.length;

      if (outliersCount > 0) {
        anomalies.push(`Detected ${outliersCount} outlier values (outside IQR bounds)`);
      }

      stats = {
        min,
        max,
        mean,
        median,
        outliersCount
      };
    }

    // Text structure anomalies: e.g. checking mixed formats in string fields
    if (dataType === 'string' && nonNullValues.length > 0) {
      const hasNumbers = rawValues.some((v) => v !== null && v !== undefined && !isNaN(Number(v)) && String(v).trim() !== '');
      if (hasNumbers && uniqueCount > 2) {
        anomalies.push('Field contains mixed text and numeric formats');
      }
    }

    return {
      name: key,
      dataType,
      nullCount,
      nullRate,
      uniqueCount,
      stats,
      anomalies
    };
  });

  return {
    rowCount,
    columnCount,
    columns
  };
};
