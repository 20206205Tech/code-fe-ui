'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Loader2, RotateCw } from 'lucide-react';
import {
  TTSVoice,
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

export default function VoicesAdmin() {
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [engines, setEngines] = useState<TTSEngine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVoice, setEditingVoice] = useState<TTSVoice | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    voice_code: '',
    engine_id: '',
    is_active: true,
  });

  const handleSyncElevenLabs = async () => {
    try {
      setIsSyncing(true);
      const res = await personaService.syncElevenLabs();
      toast.success(`Đồng bộ thành công ${res.synced_count} giọng nói từ ElevenLabs!`);
      fetchData();
    } catch (error: any) {
      console.error('Sync failed:', error);
      const errMsg = error?.response?.data?.detail || 'Đã xảy ra lỗi';
      toast.error(`Lỗi đồng bộ ElevenLabs: ${errMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [voicesData, enginesData] = await Promise.all([
        personaService.getVoicesAdmin(),
        personaService.getEnginesAdmin(),
      ]);
      setVoices(voicesData);
      setEngines(enginesData);
    } catch (error) {
      console.error('Failed to fetch voices or engines:', error);
      toast.error('Không thể tải danh sách TTS Voices hoặc Engines');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingVoice(null);
    setFormData({
      voice_code: '',
      engine_id: engines.length > 0 ? engines[0].id : '',
      is_active: true,
    });
    setIsOpeningDialog(true);
  };

  const handleOpenEditDialog = (voice: TTSVoice) => {
    setEditingVoice(voice);
    setFormData({
      voice_code: voice.voice_code,
      engine_id: voice.engine_id,
      is_active: voice.is_active,
    });
    setIsOpeningDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voice_code.trim() || !formData.engine_id) {
      toast.error('Vui lòng nhập đầy đủ Voice Code và chọn Engine');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingVoice) {
        await personaService.updateVoice(editingVoice.voice_uuid, formData);
        toast.success('Đã cập nhật TTS Voice thành công');
      } else {
        await personaService.createVoice(formData);
        toast.success('Đã tạo TTS Voice mới thành công');
      }
      setIsOpeningDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Submit failed:', error);
      const errMsg = error?.response?.data?.detail || 'Đã xảy ra lỗi';
      toast.error(
        editingVoice
          ? `Không thể cập nhật Voice: ${errMsg}`
          : `Không thể tạo Voice: ${errMsg}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVoice = async (voice_uuid: string) => {
    if (
      !confirm(
        'Bạn có chắc chắn muốn xóa TTS Voice này? Xóa voice có thể ảnh hưởng đến các Nhân vật đang sử dụng nó.'
      )
    )
      return;

    try {
      await personaService.deleteVoice(voice_uuid);
      toast.success('Đã xóa TTS Voice thành công');
      fetchData();
    } catch (error: any) {
      console.error('Delete failed:', error);
      const errMsg = error?.response?.data?.detail || 'Đã xảy ra lỗi';
      toast.error(`Không thể xóa Voice: ${errMsg}`);
    }
  };

  const getEngineDisplay = (engineId: string) => {
    const engine = engines.find((e) => e.id === engineId);
    if (!engine) return 'Không xác định';
    return `${engine.name} (${engine.code})`;
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
          <h2 className="text-2xl font-bold">Quản lý TTS Voices</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Thiết lập danh sách các giọng đọc (voice_code) tương ứng với từng
            Engine
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncElevenLabs}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4 mr-2" />
            )}
            Đồng bộ ElevenLabs
          </Button>
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="w-4 h-4 mr-2" /> Thêm TTS Voice
          </Button>
        </div>
      </div>

      <Dialog open={isOpeningDialog} onOpenChange={setIsOpeningDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingVoice ? 'Chỉnh sửa TTS Voice' : 'Tạo TTS Voice mới'}
              </DialogTitle>
              <DialogDescription>
                Nhập mã giọng đọc (voice_code) từ bộ máy TTS tương ứng.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="voice_code">Voice Code (mã giọng TTS)</Label>
                <Input
                  id="voice_code"
                  value={formData.voice_code}
                  onChange={(e) =>
                    setFormData({ ...formData, voice_code: e.target.value })
                  }
                  placeholder="VD: vi-VN-HoaiMyNeural, cjVigY5qzO86Huf0OWal..."
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="engine_id">TTS Engine liên kết</Label>
                <select
                  id="engine_id"
                  value={formData.engine_id}
                  onChange={(e) =>
                    setFormData({ ...formData, engine_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="" disabled>
                    Chọn TTS Engine
                  </option>
                  {engines.map((engine) => (
                    <option key={engine.id} value={engine.id}>
                      {engine.name} ({engine.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label
                  htmlFor="active"
                  className="cursor-pointer text-sm font-medium"
                >
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
                {editingVoice ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voice ID / Tên giọng</TableHead>
              <TableHead>Bộ máy TTS Engine</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có TTS Voice nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              voices.map((voice) => (
                <TableRow key={voice.voice_uuid}>
                  <TableCell className="font-mono text-xs">
                    {voice.voice_code}
                  </TableCell>
                  <TableCell>{getEngineDisplay(voice.engine_id)}</TableCell>
                  <TableCell>
                    <Badge variant={voice.is_active ? 'default' : 'secondary'}>
                      {voice.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(voice)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteVoice(voice.voice_uuid)}
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
