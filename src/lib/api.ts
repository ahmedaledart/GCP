// Core Data API for the platform
import { commoditiesData, marketNews } from '../data/mockData';

// User Authentication State
const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('platform_user') || 'null');
  } catch (e) {
    return null;
  }
};

// Auth Services
export const auth = {
  get currentUser() {
    return getSavedUser();
  },
  onAuthStateChanged: (arg1: any, arg2?: any) => {
    const callback = typeof arg1 === 'function' ? arg1 : arg2;
    const handleStorageChange = () => {
      callback(auth.currentUser);
    };
    window.addEventListener('storage', handleStorageChange);
    callback(auth.currentUser);
    return () => window.removeEventListener('storage', handleStorageChange);
  }
};

export const googleProvider = { providerId: 'google.com' };

export const signInWithPopup = async (_auth: any, _provider: any) => {
  const user = {
    uid: 'admin-123',
    email: 'ahmedhmeda67@gmail.com',
    displayName: 'Ahmed Admin',
    photoURL: 'https://ui-avatars.com/api/?name=Ahmed+Admin&background=D4AF37&color=fff',
    emailVerified: true,
    otpVerified: true // Set this to true by default now
  };
  localStorage.setItem('platform_user', JSON.stringify(user));
  window.dispatchEvent(new Event('storage'));
  return { user };
};

export const signOut = async (_auth: any) => {
  localStorage.removeItem('platform_user');
  window.dispatchEvent(new Event('storage'));
};

export const onAuthStateChanged = auth.onAuthStateChanged;
export const signInWithEmailAndPassword = async () => { throw new Error('Use Google Login'); };

// Database Operations
export const db = { type: 'local-json' };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.warn('Backend API Error:', error, operationType, path);
}

const fetchDB = async () => {
  if (fetchDB.promise) return fetchDB.promise;
  fetchDB.promise = (async () => {
    return { settings: {}, commodities: [...commoditiesData], news: [], reports: [], messages: [], logs: [], sectors: [], exchange_rates: [], system_users: [] };
  })();
  return fetchDB.promise;
};
fetchDB.promise = null as Promise<any> | null;



const saveDB = async (data: any) => {
  console.log('Dummy saveDB', data);
};

// Data normalization helper (maintains compatibility with existing UI components)
const wrap = (data: any) => {
  if (!data) return data;
  const wrapped = { ...data };
  ['createdAt', 'updatedAt', 'publishedAt', 'timestamp'].forEach(key => {
    if (wrapped[key]) {
      const val = wrapped[key];
      const date = new Date(val?.seconds ? val.seconds * 1000 : val);
      wrapped[key] = {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0
      };
    }
  });
  return wrapped;
};

// Firebase-compatible interface but mapped to our custom local API
export const collection = (_db: any, name: string, ..._rest: any[]) => ({ name });
export const doc = (_db: any, col: string, id: string, ..._rest: any[]) => ({ col, id });
export const query = (ref: any, ..._constraints: any[]) => ref;
export const increment = (val: number) => ({ __type: 'increment', val });
export const orderBy = (..._args: any[]) => ({});
export const where = (..._args: any[]) => ({});
export const limit = (..._args: any[]) => ({});
export const serverTimestamp = () => new Date().toISOString();

export const getDocs = async (ref: any) => {
  const data = await fetchDB();
  const colName = ref.name || ref.col;
  const items = data[colName] || [];
  return {
    empty: items.length === 0,
    docs: items.map((i: any) => ({ id: i.id, data: () => wrap(i) }))
  };
};

export const onSnapshot = (ref: any, callback: any, _errorCallback?: any) => {
  const doFetch = async () => {
    const data = await fetchDB();
    const colName = ref.name || ref.col;
    const id = ref.id;

    if (id) {
      // Document Snapshot
      let docData = null;
      if (colName === 'settings') {
        docData = data.settings?.[id] || data.settings; // Support nested id if needed
      } else {
        docData = (data[colName] || []).find((i: any) => i.id === id);
      }
      callback({ exists: () => !!docData, id, data: () => wrap(docData || {}) });
    } else {
      // Collection Snapshot
      const items = data[colName] || [];
      callback({ docs: items.map((d: any) => ({ id: d.id, data: () => wrap(d) })) });
    }
  };
  doFetch();
  
  const handleUpdate = () => {
    doFetch();
  };
  window.addEventListener('db_updated', handleUpdate);
  
  const interval = setInterval(doFetch, 10000); // Fallback poll every 10s
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('db_updated', handleUpdate);
  };
};

export const getDoc = async (ref: any) => {
  const data = await fetchDB();
  const colName = ref.col || ref.name;
  const id = ref.id;
  
  let docData = null;
  if (colName === 'settings') {
    docData = data.settings?.[id] || data.settings;
  } else {
    docData = (data[colName] || []).find((i: any) => i.id === id);
  }
  return { exists: () => !!docData, id, data: () => wrap(docData || {}) };
};

export const getDocFromServer = getDoc;

export const setDoc = async (ref: any, content: any) => {
  const data = await fetchDB();
  const colName = ref.col || ref.name;
  const id = ref.id;
  
  if (colName === 'settings') {
    if (!data.settings) data.settings = {};
    data.settings[id] = content;
  } else {
    if (!data[colName]) data[colName] = [];
    const idx = data[colName].findIndex((i: any) => i.id === id);
    if (idx !== -1) {
      data[colName][idx] = { ...data[colName][idx], ...content };
    } else {
      data[colName].push({ ...content, id });
    }
  }
  await saveDB(data);
};

export const addDoc = async (ref: any, content: any) => {
  const data = await fetchDB();
  const colName = ref.name || ref.col;
  if (!data[colName]) data[colName] = [];
  const newItem = { ...content, id: Date.now().toString() };
  data[colName].push(newItem);
  await saveDB(data);
  return { id: newItem.id };
};

export const updateDoc = async (ref: any, content: any) => {
  const data = await fetchDB();
  const colName = ref.col || ref.name;
  const id = ref.id;
  
  if (colName === 'settings') {
    if (!data.settings) data.settings = {};
    data.settings[id] = { ...data.settings[id], ...content };
  } else if (data[colName]) {
    const idx = data[colName].findIndex((i: any) => i.id === id);
    if (idx !== -1) data[colName][idx] = { ...data[colName][idx], ...content };
  }
  await saveDB(data);
};

export const deleteDoc = async (ref: any) => {
  const data = await fetchDB();
  const colName = ref.col || ref.name;
  const id = ref.id;
  
  if (colName === 'settings') {
    if (data.settings) delete data.settings[id];
  } else if (data[colName]) {
    data[colName] = data[colName].filter((i: any) => i.id !== id);
  }
  await saveDB(data);
};

export const logUserActivity = async (action: string, details: string) => {
  await addDoc(collection(null, 'activity_logs'), {
    userEmail: auth.currentUser?.email || 'Guest',
    action,
    details,
    timestamp: serverTimestamp()
  });
};

