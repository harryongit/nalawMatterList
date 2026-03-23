import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { db } from '../firebase/config';
import { 
  collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, query, orderBy 
} from 'firebase/firestore';

// API functions
const fetchClients = async () => {
  const q = query(collection(db, 'clients'), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const fetchCase = async (id) => {
  if (!id) return null;
  const docRef = doc(db, 'masterCases', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } : null;
};

const saveCase = async ({ id, formData, oldNextDate }) => {
  if (id) {
    const updates = { ...formData, updatedAt: serverTimestamp() };
    if (formData.nextDate !== oldNextDate) {
      await addDoc(collection(db, 'caseLogs'), {
        caseId: id,
        action: "Next Date Updated",
        date: formData.nextDate,
        createdAt: serverTimestamp()
      });
    }
    await updateDoc(doc(db, 'masterCases', id), updates);
  } else {
    const newDoc = await addDoc(collection(db, 'masterCases'), {
      ...formData,
      calendarSynced: false,
      eventId: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, 'caseLogs'), {
      caseId: newDoc.id,
      action: "Created",
      date: formData.nextDate,
      createdAt: serverTimestamp()
    });
  }
};

const CaseForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    caseName: '',
    clientId: location.state?.clientId || '',
    nextDate: '',
    court: '',
    status: 'active',
  });
  const [oldNextDate, setOldNextDate] = useState('');

  const { data: clients, isLoading: clientsLoading } = useQuery({ 
    queryKey: ['clients'], 
    queryFn: fetchClients 
  });

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => fetchCase(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (caseData) {
      setFormData(caseData);
      setOldNextDate(caseData.nextDate);
    }
  }, [caseData]);

  const mutation = useMutation({
    mutationFn: saveCase,
    onSuccess: () => {
      queryClient.invalidateQueries(['casesAndClients']);
      queryClient.invalidateQueries(['cases', 'byClient', formData.clientId]);
      navigate('/');
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ id, formData, oldNextDate });
  };

  if ((clientsLoading || caseLoading) && id) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {id ? 'Edit Case' : 'Add Case'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="caseName" className="block text-sm font-medium text-gray-700">Case Name</label>
            <input type="text" id="caseName" name="caseName" value={formData.caseName} onChange={handleChange} className="mt-1 block w-full input" required />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client</label>
            <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className="mt-1 block w-full input" required>
              <option value="" disabled>Select a client</option>
              {clients?.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nextDate" className="block text-sm font-medium text-gray-700">Next Hearing Date</label>
            <input type="date" id="nextDate" name="nextDate" value={formData.nextDate} onChange={handleChange} className="mt-1 block w-full input" required />
          </div>
          <div>
            <label htmlFor="court" className="block text-sm font-medium text-gray-700">Court</label>
            <input type="text" id="court" name="court" value={formData.court} onChange={handleChange} className="mt-1 block w-full input" required />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full input" required>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="flex space-x-4 pt-4">
          <button type="submit" className="btn-primary" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : (id ? 'Update Case' : 'Create Case')}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;
