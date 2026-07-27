import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { getDatesForDayOfWeek, formatDateString } from '../events/eventGeneratorService';

const GROUPS_COLLECTION = 'discipleshipGroups';
const MATERIALS_COLLECTION = 'discipleshipGroupMaterials';
const EVENTS_COLLECTION = 'events';

// --- Discipleship / Small Groups CRUD ---

export const getDiscipleshipGroups = async (churchId) => {
  if (!churchId) throw new Error("churchId is required");
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('churchId', '==', churchId)
  );
  const snapshot = await getDocs(q);
  const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return groups.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

export const getDiscipleshipGroup = async (churchId, groupId) => {
  if (!churchId) throw new Error("churchId is required");
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().churchId === churchId) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const createDiscipleshipGroup = async (churchId, groupData, userId) => {
  if (!churchId) throw new Error("churchId is required");
  const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
    name: groupData.name || '',
    description: groupData.description || '',
    groupType: groupData.groupType || 'small_group',
    meetingDay: groupData.meetingDay || 'Sunday',
    meetingTime: groupData.meetingTime || '18:00',
    meetingLocation: groupData.meetingLocation || '',
    planId: groupData.planId || null,
    planTitle: groupData.planTitle || null,
    currentLessonId: groupData.currentLessonId || null,
    currentWeekNumber: groupData.currentWeekNumber || null,
    leaderMemberIds: groupData.leaderMemberIds || [],
    leaderUserIds: groupData.leaderUserIds || [],
    memberIds: groupData.memberIds || [],
    userIds: groupData.userIds || [],
    status: groupData.status || 'active',
    churchId,
    createdBy: userId || null,
    updatedBy: userId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateDiscipleshipGroup = async (churchId, groupId, groupData, userId) => {
  if (!churchId) throw new Error("churchId is required");
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  const cleanData = { ...groupData };
  delete cleanData.id;
  await updateDoc(docRef, {
    ...cleanData,
    updatedBy: userId || null,
    updatedAt: serverTimestamp()
  });
};

export const attachDiscipleshipPlanToGroup = async (churchId, groupId, planId, planTitle, currentWeekNumber = 1, currentLessonId = null, userId) => {
  if (!churchId || !groupId || !planId) throw new Error("churchId, groupId, and planId are required");
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    planId,
    planTitle,
    currentWeekNumber: currentWeekNumber || 1,
    currentLessonId: currentLessonId || null,
    updatedBy: userId || null,
    updatedAt: serverTimestamp()
  });
};

export const advanceGroupWeek = async (churchId, groupId, nextWeekNumber, nextLessonId, userId) => {
  if (!churchId || !groupId) throw new Error("churchId and groupId are required");
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    currentWeekNumber: nextWeekNumber,
    currentLessonId: nextLessonId || null,
    updatedBy: userId || null,
    updatedAt: serverTimestamp()
  });
};

export const removeGroupPlanFromGroup = async (churchId, groupId, userId) => {
  if (!churchId || !groupId) throw new Error("churchId and groupId are required");
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    planId: null,
    planTitle: null,
    currentWeekNumber: null,
    currentLessonId: null,
    updatedBy: userId || null,
    updatedAt: serverTimestamp()
  });
};

export const deleteDiscipleshipGroup = async (churchId, groupId) => {
  if (!churchId) throw new Error("churchId is required");
  await deleteDoc(doc(db, GROUPS_COLLECTION, groupId));
};

export const assignGroupLeadersAndMembers = async (churchId, groupId, leaderMemberIds = [], memberIds = [], userId) => {
  if (!churchId || !groupId) throw new Error("churchId and groupId are required");
  const docRef = doc(db, GROUPS_COLLECTION, groupId);
  await updateDoc(docRef, {
    leaderMemberIds,
    memberIds,
    updatedBy: userId,
    updatedAt: serverTimestamp()
  });
};

// --- Leader Materials ---

export const getGroupMaterials = async (churchId, groupId = null) => {
  if (!churchId) throw new Error("churchId is required");
  
  let q;
  if (groupId) {
    q = query(
      collection(db, MATERIALS_COLLECTION),
      where('churchId', '==', churchId),
      where('groupId', '==', groupId)
    );
  } else {
    q = query(
      collection(db, MATERIALS_COLLECTION),
      where('churchId', '==', churchId)
    );
  }
  
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return docs.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });
};

export const uploadGroupMaterial = async ({
  churchId,
  groupId = null,
  planId = null,
  lessonId = null,
  eventId = null,
  title,
  description = '',
  materialType = 'leader_guide',
  audience = 'leaders_only',
  status = 'published',
  file,
  userId
}) => {
  if (!churchId) throw new Error("churchId is required");
  if (!file && !title) throw new Error("File and title are required");

  // Document reference in Firestore
  const materialRef = doc(collection(db, MATERIALS_COLLECTION));
  const materialId = materialRef.id;

  let fileUrl = '';
  let storagePath = '';

  if (file) {
    const filename = `${Date.now()}_${file.name}`;
    if (groupId) {
      storagePath = `churches/${churchId}/discipleship/groups/${groupId}/materials/${materialId}/${filename}`;
    } else {
      storagePath = `churches/${churchId}/discipleship/materials/${materialId}/${filename}`;
    }

    const fileStorageRef = ref(storage, storagePath);
    const uploadTask = await uploadBytesResumable(fileStorageRef, file);
    fileUrl = await getDownloadURL(uploadTask.ref);
  }

  await updateDoc(doc(db, MATERIALS_COLLECTION, materialId), {
    id: materialId,
    churchId,
    groupId,
    planId,
    lessonId,
    eventId,
    title,
    description,
    materialType,
    audience,
    fileUrl,
    storagePath,
    status,
    uploadedBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }).catch(async (err) => {
    // If updateDoc fails because doc wasn't created yet with setDoc
    const batch = writeBatch(db);
    batch.set(materialRef, {
      id: materialId,
      churchId,
      groupId: groupId || null,
      planId: planId || null,
      lessonId: lessonId || null,
      eventId: eventId || null,
      title,
      description,
      materialType,
      audience,
      fileUrl,
      storagePath,
      status,
      uploadedBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await batch.commit();
  });

  return materialId;
};

export const deleteGroupMaterial = async (churchId, materialId, storagePath) => {
  if (!churchId) throw new Error("churchId is required");
  if (storagePath) {
    try {
      const fileStorageRef = ref(storage, storagePath);
      await deleteObject(fileStorageRef);
    } catch (e) {
      console.warn("Could not delete file from Storage:", e);
    }
  }
  await deleteDoc(doc(db, MATERIALS_COLLECTION, materialId));
};

// --- Weekly Group Meetings Event Generator ---

export const getGroupEvents = async (churchId, groupId) => {
  if (!churchId) throw new Error("churchId is required");
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('churchId', '==', churchId),
    where('groupId', '==', groupId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return docs.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
};

export const previewWeeklyGroupMeetings = async (churchId, groupId, group, year, month) => {
  if (!churchId || !groupId || !group) throw new Error("churchId, groupId and group are required");

  const meetingDay = group.meetingDay || 'Sunday';
  const dates = getDatesForDayOfWeek(year, month, meetingDay);

  // Fetch existing events for this group & month to prevent duplicates
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const existingGroupEvents = await getGroupEvents(churchId, groupId);
  const existingDates = new Set(
    existingGroupEvents
      .filter(e => e.date && e.date.startsWith(monthStr))
      .map(e => `${e.date}_${e.startTime || group.meetingTime}`)
  );

  const preview = dates.map(dateObj => {
    const dateStr = formatDateString(dateObj);
    const startTime = group.meetingTime || '18:00';
    const isDuplicate = existingDates.has(`${dateStr}_${startTime}`);

    return {
      _previewId: `${groupId}_${dateStr}`,
      churchId,
      groupId,
      title: `${group.name} - Weekly Meeting`,
      category: group.groupType === 'discipleship' ? 'discipleship' : 'small_group',
      date: dateStr,
      startTime: startTime,
      endTime: '',
      location: group.meetingLocation || 'TBD',
      status: 'published',
      enableAttendance: true,
      enableVolunteer: false,
      enableRSVP: true,
      isDuplicate,
      selected: !isDuplicate
    };
  });

  return preview;
};

export const saveGroupMeetingEvents = async (churchId, eventsToSave, userId) => {
  if (!churchId) throw new Error("churchId is required");
  const batch = writeBatch(db);

  eventsToSave.forEach(evt => {
    const docRef = doc(collection(db, EVENTS_COLLECTION));
    batch.set(docRef, {
      churchId,
      groupId: evt.groupId,
      title: evt.title,
      description: `Weekly meeting for group`,
      category: evt.category || 'small_group',
      date: evt.date,
      startTime: evt.startTime,
      endTime: evt.endTime || '',
      location: evt.location || '',
      status: 'published',
      enableAttendance: true,
      enableVolunteer: false,
      enableRSVP: true,
      source: 'group_weekly_generator',
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
};
