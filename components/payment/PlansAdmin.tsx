'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, CreditCard } from 'lucide-react';
import {
  Plan,
  CreatePlanRequestDto,
  paymentService,
} from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePlanRequestDto>({
    name: '',
    durationMonths: 1,
    price: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await paymentService.getPlans(0, 50); // Fetch up to 50 plans for admin
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('Không thể tải danh sách gói cước');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await paymentService.createPlan(formData);
      toast.success('Đã tạo gói cước mới');
      setIsOpeningDialog(false);
      setFormData({ name: '', durationMonths: 1, price: 0, isActive: true });
      fetchPlans();
    } catch (error) {
      console.error('Create failed:', error);
      toast.error('Không thể tạo gói cước');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gói cước này?')) return;

    try {
      await paymentService.deletePlan(id);
      toast.success('Đã xóa gói cước');
      fetchPlans();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Không thể xóa gói cước');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Quản lý gói cước</h2>
          <p className="text-muted-foreground">Quản lý các gói đăng ký</p>
        </div>

        <Dialog open={isOpeningDialog} onOpenChange={setIsOpeningDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Thêm gói mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreatePlan}>
              <DialogHeader>
                <DialogTitle>Tạo gói cước mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin chi tiết cho gói đăng ký mới.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Tên gói
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="VD: VIP 1 tháng"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="months" className="text-right">
                    Số tháng
                  </Label>
                  <Input
                    id="months"
                    type="number"
                    className="col-span-3"
                    value={formData.durationMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMonths: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Giá (VND)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    className="col-span-3"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value),
                      })
                    }
                    min="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">
                    Kích hoạt
                  </Label>
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên gói</TableHead>
              <TableHead>Thời hạn</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có gói cước nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{plan.durationMonths} tháng</TableCell>
                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Đang bật' : 'Đã tắt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.info('Tính năng Edit sẽ sớm ra mắt')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button> */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
