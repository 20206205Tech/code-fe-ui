'use client';

import { Sidebar } from '@/components/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserMenuHeader } from '@/components/user-menu-header';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Import services
import {
  DataPipelineVbplnewService,
  DocType,
  EffStatus,
  DocumentStatus as VbplnewDocumentStatus,
  DocumentTotal as VbplnewDocumentTotal,
  IssueDate as VbplnewIssueDate,
  WorkflowSummary as VbplnewWorkflowSummary,
} from '@/services/data-pipeline-vbplnew.service';

import {
  ChuDe,
  DataPipelinePhapDienService,
  DeMuc,
  PhapDienSummary,
} from '@/services/data-pipeline-phapdien.service';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#ffc658',
  '#ef5350',
  '#ab47bc',
];

export default function AdminDataPipelinePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, tokens } = useAuth();

  const isAdmin = user?.role === 'admin';
  const token = tokens?.access_token;

  // State cho VBPLNEW
  const [vbplnewData, setVbplnewData] = useState<{
    docTotal: VbplnewDocumentTotal | null;
    docStatus: VbplnewDocumentStatus[];
    issueDates: VbplnewIssueDate[];
    workflowSummary: VbplnewWorkflowSummary[];
    docTypes: DocType[];
    effStatuses: EffStatus[];
  }>({
    docTotal: null,
    docStatus: [],
    issueDates: [],
    workflowSummary: [],
    docTypes: [],
    effStatuses: [],
  });

  // State cho Pháp Điển
  const [phapDienData, setPhapDienData] = useState<{
    summary: PhapDienSummary | null;
    chuDe: ChuDe[];
    deMuc: DeMuc[];
  }>({
    summary: null,
    chuDe: [],
    deMuc: [],
  });

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [yearRange, setYearRange] = useState<number | 'all'>(20);

  // Load Data cho VBPLNEW
  useEffect(() => {
    async function loadVbplnewData() {
      // const accessToken = token || '';
      try {
        const [total, status, dates, summary, docTypes, effStatuses] =
          await Promise.all([
            DataPipelineVbplnewService.getDocumentTotal(),
            DataPipelineVbplnewService.getDocumentStatus(),
            DataPipelineVbplnewService.getIssueDates(),
            DataPipelineVbplnewService.getWorkflowSummary(),
            DataPipelineVbplnewService.getDocTypes(),
            DataPipelineVbplnewService.getEffStatuses(),
          ]);

        setVbplnewData({
          docTotal: total,
          docStatus: status.map((s) => ({
            ...s,
            status: s.status || 'Chưa phân loại',
          })),
          issueDates: dates.sort((a, b) => a.year - b.year),
          workflowSummary: summary,
          docTypes: docTypes.slice(0, 10), // Top 10
          effStatuses: effStatuses,
        });
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu VBPLNEW:', error);
      }
    }

    if (isAuthenticated && isAdmin) {
      loadVbplnewData();
    }
  }, [isAuthenticated, isAdmin, token]);

  // Load Data cho Pháp Điển
  useEffect(() => {
    async function loadPhapDienData() {
      // const accessToken = token || '';
      try {
        const [summary, chuDe, deMuc] = await Promise.all([
          DataPipelinePhapDienService.getSummary(),
          DataPipelinePhapDienService.getChuDe(),
          DataPipelinePhapDienService.getDeMuc(),
        ]);

        setPhapDienData({
          summary,
          chuDe,
          deMuc,
        });
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu Pháp Điển:', error);
      } finally {
        setIsDataLoading(false);
      }
    }

    if (isAuthenticated && isAdmin) {
      loadPhapDienData();
    }
  }, [isAuthenticated, isAdmin, token]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/chat');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const filteredIssueDates = vbplnewData.issueDates.filter((d) => {
    const currentYear = new Date().getFullYear();
    if (d.year > currentYear) return false;
    if (yearRange === 'all') return true;
    return d.year >= currentYear - yearRange;
  });

  if (isLoading || !isAdmin || isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col md:ml-0 overflow-hidden">
        <UserMenuHeader />
        <main className="flex-1 overflow-y-auto pt-16 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Data Pipeline Dashboard
            </h1>

            <Tabs defaultValue="vbplnew" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="vbplnew">VBPL New</TabsTrigger>
                <TabsTrigger value="phapdien">Pháp Điển</TabsTrigger>
              </TabsList>

              {/* Tab VBPLNEW */}
              <TabsContent value="vbplnew" className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Tổng số văn bản
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {vbplnewData.docTotal?.total_count.toLocaleString() ||
                        '0'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Loại văn bản
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {vbplnewData.docTypes.length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Trạng thái hiệu lực
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {vbplnewData.effStatuses.length}
                    </p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Biểu đồ Top 10 Loại văn bản */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                      Top 10 Loại văn bản
                    </h2>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={vbplnewData.docTypes}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) =>
                              value.toLocaleString()
                            }
                          />
                          <Bar dataKey="total_count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Biểu đồ Trạng thái hiệu lực */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                      Trạng thái hiệu lực
                    </h2>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={vbplnewData.effStatuses}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="total_count"
                            nameKey="name"
                          >
                            {vbplnewData.effStatuses.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) =>
                              value.toLocaleString()
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Biểu đồ phân bố theo năm */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Phân bố theo năm ban hành{' '}
                        {yearRange === 'all'
                          ? '(Tất cả)'
                          : `(${yearRange} năm)`}
                      </h2>
                      <select
                        value={yearRange}
                        onChange={(e) => {
                          const val = e.target.value;
                          setYearRange(val === 'all' ? 'all' : Number(val));
                        }}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none cursor-pointer"
                      >
                        <option value={5}>5 năm</option>
                        <option value={10}>10 năm</option>
                        <option value={20}>20 năm</option>
                        <option value="all">Tất cả thời gian</option>
                      </select>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredIssueDates}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) =>
                              value.toLocaleString()
                            }
                            labelFormatter={(label) => `Năm: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#3b82f6' }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Biểu đồ Workflow Summary */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                      Tiến trình Data Pipeline
                    </h2>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={vbplnewData.workflowSummary}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.2}
                            horizontal={true}
                            vertical={false}
                          />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="code"
                            type="category"
                            width={250}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) =>
                              value.toLocaleString()
                            }
                          />
                          <Bar
                            dataKey="total_items"
                            fill="#8b5cf6"
                            radius={[0, 4, 4, 0]}
                          >
                            {vbplnewData.workflowSummary.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Pháp Điển */}
              <TabsContent value="phapdien" className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Tổng Chủ đề
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {phapDienData.summary?.total_chu_de || 0}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Tổng Đề mục
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {phapDienData.summary?.total_de_muc || 0}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Tổng Tree Items
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {phapDienData.summary?.total_tree_items.toLocaleString() ||
                        0}
                    </p>
                  </div>
                </div>

                {/* Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bảng Chủ đề */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                      Danh sách Chủ đề (Top 20)
                    </h2>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">
                              STT
                            </th>
                            <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">
                              Tên Chủ đề
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {phapDienData.chuDe.slice(0, 20).map((item) => (
                            <tr
                              key={item.value}
                              className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <td className="p-2 text-slate-600 dark:text-slate-400">
                                {item.stt}
                              </td>
                              <td className="p-2 text-slate-900 dark:text-white">
                                {item.text}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bảng Đề mục */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                      Danh sách Đề mục (Top 20)
                    </h2>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">
                              STT
                            </th>
                            <th className="text-left p-2 font-semibold text-slate-700 dark:text-slate-300">
                              Tên Đề mục
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {phapDienData.deMuc.slice(0, 20).map((item) => (
                            <tr
                              key={item.value}
                              className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <td className="p-2 text-slate-600 dark:text-slate-400">
                                {item.stt}
                              </td>
                              <td className="p-2 text-slate-900 dark:text-white">
                                {item.text}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
