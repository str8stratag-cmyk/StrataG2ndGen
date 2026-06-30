export function isAccidentCall(transcript: string): boolean {
  const text = transcript.toLowerCase();
  const keywords = [
    'signal 4', 'signal four', '10-50', '10-45', '10-52', 'crash', 'mva', 'mvc',
    'accident', 'collision', 'vehicle accident', 'auto accident', 'rollover',
    'vehicle fire', 'injuries', 'entrapment', 'ejection', 'pin-in'
  ];
  return keywords.some(kw => text.includes(kw));
}

export function extractAccidentKeywords(transcript: string): string[] {
  const text = transcript.toLowerCase();
  const keywords = [
    'signal 4', 'signal four', '10-50', '10-45', '10-52', 'crash', 'mva', 'mvc',
    'accident', 'collision', 'rollover', 'injuries', 'entrapment', 'ejection',
    'pin-in', 'vehicle fire', 'hazmat', 'spill', 'debris', 'blocking'
  ];
  return keywords.filter(kw => text.includes(kw));
}

export function determineSeverity(transcript: string): 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR' {
  const text = transcript.toLowerCase();
  
  if (text.includes('signal 4') || text.includes('10-50') || text.includes('injuries') || 
      text.includes('entrapment') || text.includes('ejection') || text.includes('vehicle fire') ||
      text.includes('hazmat') || text.includes('pin-in')) {
    return 'CRITICAL';
  }
  
  if (text.includes('crash') || text.includes('mva') || text.includes('mvc') || 
      text.includes('rollover') || text.includes('collision')) {
    return 'MAJOR';
  }
  
  if (text.includes('accident') || text.includes('debris') || text.includes('blocking')) {
    return 'MODERATE';
  }
  
  return 'MINOR';
}

export function detectSignalCodes(transcript: string): string[] {
  const text = transcript.toLowerCase();
  const codes = ['signal 4', 'signal four', '10-50', '10-45', '10-52', '10-33', '10-79'];
  return codes.filter(code => text.includes(code));
}
