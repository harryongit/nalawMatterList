import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { startOfWeek, endOfWeek, addDays, format, isWithinInterval, parseISO } from 'date-fns';
import CaseLogDialog from '../components/CaseLogDialog';

// API functions
const fetchCasesAndClients = async () => {
  const casesQuery = query(collection(db, 'masterCases'), orderBy('nextDate', 'asc'));
  const clientsQuery = query(collection(db, 'clients'));

  const [casesSnapshot, clientsSnapshot] = await Promise.all([
    getDocs(casesQuery),
    getDocs(clientsQuery),
  ]);

  const cases = casesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const clients = clientsSnapshot.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data().name;
    return acc;
  }, {});

  return { cases, clients };
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({ 
    queryKey: ['casesAndClients'], 
    queryFn: fetchCasesAndClients 
  });

  const { cases = [], clients = {} } = data || {};

  const filteredCases = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 6 });
    const endOfCurrentWeek = endOfWeek(new Date(), { weekStartsOn: 6 });

    if (filter === 'today') return cases.filter(c => c.nextDate === todayStr);
    if (filter === 'thisWeek') {
      return cases.filter(c => {
        const date = parseISO(c.nextDate);
        return isWithinInterval(date, { start: startOfCurrentWeek, end: endOfCurrentWeek });
      });
    }
    return cases;
  }, [cases, filter]);

  const stats = useMemo(() => ({
    todayCases: cases.filter(c => c.nextDate === format(new Date(), 'yyyy-MM-dd')).length,
    activeCases: cases.filter(c => c.status === 'active').length,
    totalClients: Object.keys(clients).length,
  }), [cases, clients]);

  const exportWeeklyCases = () => {
    const today = new Date();
    const saturday = addDays(today, today.getDay() === 6 ? 0 : -1 - today.getDay() + 6);
    const friday = addDays(saturday, 6);

    const weeklyCases = cases.filter(c => isWithinInterval(parseISO(c.nextDate), { start: saturday, end: friday }));
    const exportData = weeklyCases.map(c => ({
      'Case Name': c.caseName,
      'Client Name': clients[c.clientId] || 'N/A',
      'Next Date': c.nextDate,
      'Court': c.court,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Cases");
    XLSX.writeFile(wb, `Weekly_Cases_${format(saturday, 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) return <div className="text-center p-4">Loading dashboard...</div>;
  if (isError) return <div className="text-center p-4 text-red-500">Error loading data.</div>;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-lg font-semibold text-gray-600">Today's Hearings</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.todayCases}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-lg font-semibold text-gray-600">Active Matters</h3>
          <p className="text-4xl font-bold text-green-600">{stats.activeCases}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-lg font-semibold text-gray-600">Total Clients</h3>
          <p className="text-4xl font-bold text-purple-600">{stats.totalClients}</p>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="filter" className="font-semibold">Filter:</label>
            <select id="filter" value={filter} onChange={e => setFilter(e.target.value)} className="border-gray-300 rounded-md">
              <option value="all">All Cases</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
            </select>
          </div>
          <div className="flex space-x-4">
            <button onClick={exportWeeklyCases} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Export Weekly</button>
            <Link to="/cases/add" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Case</Link>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Case Name</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Client</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Next Date</th>
              <th className="py-3 px-4 text-left text-gray-600 font-semibold">Court</th>
              <th className="py-3 px-4 text-center text-gray-600 font-semibold">Status</th>
              <th className="py-3 px-4 text-right text-gray-600 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map(caseItem => (
              <tr key={caseItem.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{caseItem.caseName}</td>
                <td className="py-3 px-4">{clients[caseItem.clientId] || 'N/A'}</td>
                <td className="py-3 px-4">{caseItem.nextDate}</td>
                <td className="py-3 px-4">{caseItem.court}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${caseItem.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {caseItem.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => { setSelectedCase(caseItem); setLogDialogOpen(true); }} className="text-gray-500 hover:underline">Logs</button>
                  <Link to={`/cases/edit/${caseItem.id}`} className="text-blue-500 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CaseLogDialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} caseItem={selectedCase} />
    </div>
  );
};

export default Dashboard;
