'use client';

import PlansList from '@/components/payment/PlansList';
import HistoryList from '@/components/payment/HistoryList';
import { Sidebar } from '@/components/sidebar';
import { UserMenuHeader } from '@/components/user-menu-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, History } from 'lucide-react';
import { Suspense } from 'react';

export default function PlansPage() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col md:ml-0 overflow-hidden relative">
        <UserMenuHeader />

        <main className="flex-1 overflow-y-auto pt-24 pb-12 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="plans" className="w-full space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                    Cài đặt gói cước
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Quản lý các gói đăng ký và theo dõi lịch sử giao dịch của
                    bạn.
                  </p>
                </div>

                <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 h-12 shadow-sm rounded-xl">
                  <TabsTrigger
                    value="plans"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 rounded-lg px-6 transition-all duration-200"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gói cước
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 rounded-lg px-6 transition-all duration-200"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Lịch sử
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-800 opacity-20" />

              <TabsContent
                value="plans"
                className="mt-0 border-0 p-0 outline-none"
              >
                <PlansList />
              </TabsContent>

              <TabsContent
                value="history"
                className="mt-0 border-0 p-0 outline-none"
              >
                <div className="py-2">
                  <div className="text-center mb-10 md:hidden">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Lịch sử giao dịch
                    </h3>
                  </div>
                  <HistoryList />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
