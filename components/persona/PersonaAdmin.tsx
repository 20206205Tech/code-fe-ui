'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  User,
  Upload,
  Check,
  X,
} from 'lucide-react';
import {
  Persona,
  CreatePersonaRequestDto,
  UpdatePersonaRequestDto,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function PersonaAdmin() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePersonaRequestDto>({
    name: '',
    voice_id: '',
    description: '',
    avatar_url: '',
    greeting_audio_url: '',
    greeting_text: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      setIsLoading(true);
      const data = await personaService.getPersonas(1, 100);
      setPersonas(data.items);
    } catch (error) {
      console.error('Failed to fetch personas:', error);
      toast.error('Không thể tải danh sách nhân vật');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingPersona(null);
    setFormData({
      name: '',
      voice_id: '',
      description: '',
      avatar_url: '',
      greeting_audio_url: '',
      greeting_text: '',
      is_active: true,
    });
    setIsOpeningDialog(true);
  };

  const handleOpenEditDialog = (persona: Persona) => {
    setEditingPersona(persona);
    setFormData({
      name: persona.name,
      voice_id: persona.voice_id,
      description: persona.description || '',
      avatar_url: persona.avatar_url || '',
      greeting_audio_url: persona.greeting_audio_url || '',
      greeting_text: persona.greeting_text || '',
      is_active: persona.is_active,
    });
    setIsOpeningDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await personaService.uploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      toast.success('Tải ảnh lên thành công');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAudio(true);
      const url = await personaService.uploadAudio(file);
      setFormData((prev) => ({ ...prev, greeting_audio_url: url }));
      toast.success('Tải âm thanh giới thiệu thành công');
    } catch (error) {
      console.error('Audio upload failed:', error);
      toast.error('Không thể tải âm thanh lên');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingPersona) {
        await personaService.updatePersona(editingPersona.id, formData);
        toast.success('Đã cập nhật nhân vật');
      } else {
        await personaService.createPersona(formData);
        toast.success('Đã tạo nhân vật mới');
      }
      setIsOpeningDialog(false);
      fetchPersonas();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error(
        editingPersona
          ? 'Không thể cập nhật nhân vật'
          : 'Không thể tạo nhân vật'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePersona = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân vật này?')) return;

    try {
      await personaService.deletePersona(id);
      toast.success('Đã xóa nhân vật');
      fetchPersonas();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Không thể xóa nhân vật');
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
          <h2 className="text-2xl font-bold">Quản lý nhân vật</h2>
          <p className="text-muted-foreground">
            Quản lý các nhân vật (Persona) cho hệ thống
          </p>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> Thêm nhân vật
        </Button>
      </div>

      <Dialog open={isOpeningDialog} onOpenChange={setIsOpeningDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPersona ? 'Chỉnh sửa nhân vật' : 'Tạo nhân vật mới'}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin chi tiết cho nhân vật.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-muted">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback>
                      <User className="w-12 h-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <Upload className="w-6 h-6 text-white" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Tên nhân vật</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Trợ lý luật pháp"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="voice_id">Voice ID </Label>
                <Input
                  id="voice_id"
                  value={formData.voice_id}
                  onChange={(e) =>
                    setFormData({ ...formData, voice_id: e.target.value })
                  }
                  placeholder="VD: vi-VN-HoaiMyNeural"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả về tính cách hoặc vai trò của nhân vật"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="greeting_text">Câu chào (Text)</Label>
                <Input
                  id="greeting_text"
                  value={formData.greeting_text}
                  onChange={(e) =>
                    setFormData({ ...formData, greeting_text: e.target.value })
                  }
                  placeholder="VD: Xin chào, tôi có thể giúp gì cho bạn?"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audio-upload">Audio giới thiệu (.mp3)</Label>
                <div className="flex gap-2">
                  <Input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={isUploadingAudio}
                    className="flex-1"
                  />
                  {formData.greeting_audio_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        new Audio(formData.greeting_audio_url).play()
                      }
                    >
                      <Upload className="w-4 h-4 rotate-180" />
                    </Button>
                  )}
                </div>
                {isUploadingAudio && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Đang tải âm thanh...
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Kích hoạt</Label>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
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
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingPersona ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Tên nhân vật</TableHead>
              <TableHead>Voice ID</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Chưa có nhân vật nào được tạo.
                </TableCell>
              </TableRow>
            ) : (
              personas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={persona.avatar_url} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{persona.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {persona.description || 'Không có mô tả'}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {persona.voice_id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={persona.is_active ? 'default' : 'secondary'}
                    >
                      {persona.is_active ? 'Đang hoạt động' : 'Đã tắt'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(persona)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeletePersona(persona.id)}
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
