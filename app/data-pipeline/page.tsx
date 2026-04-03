'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/sidebar';
import { UserMenuHeader } from '@/components/user-menu-header';
import {
  DataPipelineService,
  DocumentTotal,
  DocumentStatus,
  IssueDate,
  WorkflowSummary,
} from '@/services/data-pipeline.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Activity, Database, FileText, CheckCircle } from 'lucide-react';

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

export default function AdminPage() {
  const router = useRouter();

  const { user, isLoading, isAuthenticated, tokens } = useAuth();

  // Kiểm tra role an toàn từ memory
  const isAdmin = user?.role === 'admin';

  const token = tokens?.access_token;

  // State lưu trữ dữ liệu
  const [docTotal, setDocTotal] = useState<DocumentTotal | null>(null);
  const [docStatus, setDocStatus] = useState<DocumentStatus[]>([]);
  const [issueDates, setIssueDates] = useState<IssueDate[]>([]);
  const [workflowSummary, setWorkflowSummary] = useState<WorkflowSummary[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // State cho bộ lọc năm của biểu đồ LineChart
  const [yearRange, setYearRange] = useState<number | 'all'>(20);

  // Load Data
  useEffect(() => {
    async function loadDashboardData() {
      // Thay 'YOUR_TOKEN' bằng token thực tế từ auth context của bạn
      const accessToken = token || 'YOUR_MOCK_TOKEN';
      try {
        const [total, status, dates, summary] = await Promise.all([
          DataPipelineService.getDocumentTotal(accessToken),
          DataPipelineService.getDocumentStatus(accessToken),
          DataPipelineService.getIssueDates(accessToken),
          DataPipelineService.getWorkflowSummary(accessToken),
        ]);

        setDocTotal(total);
        // Xử lý null status thành text "Chưa phân loại"
        setDocStatus(
          status.map((s) => ({ ...s, status: s.status || 'Chưa phân loại' }))
        );
        // Sort năm tăng dần để vẽ biểu đồ line cho đẹp
        setIssueDates(dates.sort((a, b) => a.year - b.year));
        setWorkflowSummary(summary);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setIsDataLoading(false);
      }
    }

    if (isAuthenticated && isAdmin) {
      loadDashboardData();
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

  // Logic lọc dữ liệu năm linh hoạt bằng useMemo để tối ưu hiệu suất
  const filteredIssueDates = useMemo(() => {
    if (!issueDates.length) return [];

    const currentYear = new Date().getFullYear(); // Lấy năm hiện tại tự động

    return issueDates.filter((d) => {
      // Loại bỏ các năm trong tương lai (nếu có dữ liệu rác)
      if (d.year > currentYear) return false;

      if (yearRange === 'all') return true;

      // Lấy trong khoảng yearRange tính từ năm hiện tại
      return d.year >= currentYear - yearRange;
    });
  }, [issueDates, yearRange]);

  if (isLoading || !isAdmin || isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-0 overflow-hidden">
        <UserMenuHeader />
        <main className="flex-1 overflow-y-auto pt-16 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              Data Pipeline Dashboard
            </h1>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ trạng thái văn bản */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                  Trạng thái văn bản
                </h2>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={docStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                      >
                        {docStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Biểu đồ số lượng văn bản theo năm ban hành có Nút Lọc */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    Phân bố theo năm ban hành{' '}
                    {yearRange === 'all' ? '(Tất cả)' : `(${yearRange} năm)`}
                  </h2>

                  {/* Filter Buttons */}
                  {/* <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {[5, 10, 20, 'all'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setYearRange(range as number | 'all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                          yearRange === range
                            ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {range === 'all' ? 'Tất cả' : `${range} năm`}
                      </button>
                    ))}
                  </div> */}

                  {/* Thay thế phần Filter Buttons cũ bằng Dropdown này */}
                  <div className="flex items-center">
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
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredIssueDates}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
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

              {/* Biểu đồ tiến độ Workflow */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
                  Tiến trình Data Pipeline
                </h2>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workflowSummary}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                        width={200}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number) => value.toLocaleString()}
                      />
                      <Bar
                        dataKey="total_items"
                        fill="#8b5cf6"
                        radius={[0, 4, 4, 0]}
                      >
                        {workflowSummary.map((entry, index) => (
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
          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-component cho các ô thống kê
function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
    </div>
  );
}
