export const INITIAL_DRIVERS = [];
export const INITIAL_INCIDENTS = [];
export const MOCK_RADIO_TRANSMISSIONS = [
  {
    agency: 'HCSO',
    unit: 'UNIT-12',
    transcript: 'Dispatch, Unit 12. Signal 4 on I-275 northbound near exit 42. Two vehicles involved, one rollover, requesting Signal 4 tow.',
    isSignal4: true,
    detectedKeywords: ['signal 4', 'rollover', 'I-275'],
    extractedLocation: { address: 'I-275 Northbound Exit 42, Tampa', lat: 28.015, lng: -82.462 }
  },
  {
    agency: 'Tampa PD',
    unit: 'TPD-4',
    transcript: 'Central, TPD-4. 10-50 at Kennedy Boulevard and Dale Mabry. Vehicle versus pedestrian, injuries reported.',
    isSignal4: true,
    detectedKeywords: ['10-50', 'injuries', 'Kennedy Boulevard'],
    extractedLocation: { address: 'Kennedy Blvd & Dale Mabry Hwy, Tampa', lat: 27.946, lng: -82.492 }
  },
  {
    agency: 'Hillsborough Fire',
    unit: 'HFD-3',
    transcript: 'Engine 3 on scene. MVC with possible entrapment at Hillsborough and Nebraska. Requesting heavy rescue.',
    isSignal4: true,
    detectedKeywords: ['MVC', 'entrapment', 'Hillsborough'],
    extractedLocation: { address: 'W Hillsborough Ave & N Nebraska Ave, Tampa', lat: 27.996, lng: -82.458 }
  },
  {
    agency: 'HCSO',
    unit: 'UNIT-8',
    transcript: 'Routine traffic stop on I-4 westbound. No units needed.',
    isSignal4: false,
    detectedKeywords: ['traffic stop'],
    extractedLocation: null
  },
  {
    agency: 'Tampa PD',
    unit: 'TPD-7',
    transcript: 'Signal 4 confirmed at Gandy Boulevard and West Shore. Three vehicle rear-end collision, blocking lanes.',
    isSignal4: true,
    detectedKeywords: ['signal 4', 'blocking', 'Gandy Boulevard'],
    extractedLocation: { address: 'Gandy Blvd & S West Shore Blvd, Tampa', lat: 27.892, lng: -82.52 }
  }
];

export const DEFAULT_VONAGE_CONFIG = {
  apiKey: '',
  apiSecret: '',
  signatureSecret: '',
  fromNumber: '14157386102',
  fromWhatsApp: '14157386102',
  channel: 'sms',
  mode: 'LIVE_API'
};

export const DEFAULT_RANGECAST_CONFIG = {
  feedUrl: 'https://audio.rangecast.com/hillsborough',
  feedName: 'Hillsborough County',
  mode: 'SIMULATED_AI_SYNTH',
  activeFilter: 'ONLY_SIGNAL_4',
  autoDispatchEnabled: true,
  autoDispatchRadiusMiles: 15
};
