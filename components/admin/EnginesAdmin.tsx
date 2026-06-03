'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
} from 'lucide-react';
import {
  TTSEngine,
  personaService,
} from '@/services/persona.service';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function EnginesAdmin() {
  const [engines, setEngines] = useState<TTSEngine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEngine, setEditingEngine] = useState<TTSEngine | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    is_active: true,
  });

  useEffect(() => {
    fetchEngines();
  }, []);

  const fetchEngines = async () => {
    try {
      setIsLoading(true);
      const data = await personaService.getEnginesAdmin();
      setEngines(data);
    } catch (error) {
      console.error('Failed to fetch engines:', error);
      toast.error('Không thể tải danh sách TTS Engine');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingEngine(null);
    setFormData({
      code: '',
      name: '',
      is_active: true,
    });
    setIsOpeningDialog(true);
  };

  const handleOpenEditDialog = (engine: TTSEngine) => {
    setEditingEngine(engine);
    setFormData({
      code: engine.code,
      name: engine.name,
      is_active: engine.is_active,
    });
    setIsOpeningDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Vui lòng điền đầy đủ mã và tên Engine');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingEngine) {
        await personaService.updateEngine(editingEngine.id, formData);
        toast.success('Đã cập nhật TTS Engine thành công');
      } else {
        await personaService.createEngine(formData);
        toast.success('Đã tạo TTS Engine mới thành công');
      }
      setIsOpeningDialog(false);
      fetchEngines();
    } catch (error: any) {
      console.error('Submit failed:', error);
      const errMsg = error?.response?.data?.detail || 'Đã xảy ra lỗi';
      toast.error(
        editingEngine
          ? `Không thể cập nhật Engine: ${errMsg}`
          : `Không thể tạo Engine: ${errMsg}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEngine = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa TTS Engine này? Xóa engine có thể ảnh hưởng đến các Voices và Nhân vật liên quan.')) return;

    try {
      await personaService.deleteEngine(id);
      toast.success('Đã xóa TTS Engine thành công');
      fetchEngines();
    } catch (error: any) {
      console.error('Delete failed:', error);
      const errMsg = error?.response?.data?.detail || 'Đã xảy ra lỗi';
      toast.error(`Không thể xóa Engine: ${errMsg}`);
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
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Quản lý TTS Engines</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Cấu hình các bộ máy chuyển đổi văn bản thành giọng nói (TTS)
          </p>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> Thêm TTS Engine
        </Button>
      </div>

      <Dialog open={isOpeningDialog} onOpenChange={setIsOpeningDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingEngine ? 'Chỉnh sửa TTS Engine' : 'Tạo TTS Engine mới'}
              </DialogTitle>
              <DialogDescription>
                Nhập mã định danh và tên hiển thị cho TTS Engine.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Mã Engine (Code)</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="VD: edge_tts, elevenlabs, vbee..."
                  required
                  disabled={!!editingEngine}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Tên hiển thị (Name)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Microsoft Edge TTS, ElevenLabs..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="active" className="cursor-pointer text-sm font-medium">
                  Kích hoạt
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpeningDialog(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingEngine ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Engine</TableHead>
              <TableHead>Tên hiển thị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {engines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có TTS Engine nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              engines.map((engine) => (
                <TableRow key={engine.id}>
                  <TableCell className="font-mono text-xs">{engine.code}</TableCell>
                  <TableCell className="font-medium">{engine.name}</TableCell>
                  <TableCell>
                    <Badge variant={engine.is_active ? 'default' : 'secondary'}>
                      {engine.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(engine)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteEngine(engine.id)}
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
