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
  Volume2,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Persona,
  CreatePersonaRequestDto,
  UpdatePersonaRequestDto,
  AdminAudioGenerateRequestDto,
  personaService,
  TTSEngine,
  TTSVoice,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function PersonaAdmin() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningDialog, setIsOpeningDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>('');

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [engines, setEngines] = useState<TTSEngine[]>([]);
  const [voices, setVoices] = useState<TTSVoice[]>([]);

  // Voice preview states
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isPlayingSaved, setIsPlayingSaved] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePersonaRequestDto>({
    name: '',
    gender: '',
    voice_uuid: '',
    description: '',
    avatar_url: '',
    greeting_audio_url: '',
    greeting_text: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPersonas();
    fetchEnginesAndVoices();
  }, []);

  const fetchPersonas = async (page = 1) => {
    try {
      setIsLoading(true);
      await personaService.getPersonas(page, pageSize, undefined, (data) => {
        setPersonas(data.items);
        setCurrentPage(data.page);
        setTotalPages(data.total_pages);
        setTotalItems(data.total);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Failed to fetch personas:', error);
      toast.error('Không thể tải danh sách nhân vật');
      setIsLoading(false);
    }
  };

  const fetchEnginesAndVoices = async () => {
    try {
      await personaService.getEnginesAdmin((enginesData) => {
        setEngines(enginesData);
      });
      await personaService.getVoicesAdmin(undefined, (voicesData) => {
        setVoices(voicesData);
      });
    } catch (error) {
      console.error('Failed to fetch engines/voices:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingPersona(null);
    setSelectedEngine('');
    setFormData({
      name: '',
      gender: '',
      voice_uuid: '',
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
    const voiceObj = voices.find((v) => v.voice_uuid === persona.voice_uuid);
    const engineObj = voiceObj
      ? engines.find((e) => e.id === voiceObj.engine_id)
      : null;
    setSelectedEngine(engineObj ? engineObj.code : '');
    setFormData({
      name: persona.name,
      gender: persona.gender || '',
      voice_uuid: persona.voice_uuid,
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

  const stopAudio = () => {
    if (audioInstance) {
      audioInstance.pause();
      if (audioInstance.src && audioInstance.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioInstance.src);
      }
      audioInstance.src = '';
      setAudioInstance(null);
    }
    setIsPlayingPreview(false);
    setIsPlayingSaved(false);
  };

  useEffect(() => {
    if (!isOpeningDialog) {
      stopAudio();
    }
  }, [isOpeningDialog]);

  useEffect(() => {
    return () => {
      if (audioInstance) {
        audioInstance.pause();
      }
    };
  }, [audioInstance]);

  const handlePlayPreview = async () => {
    if (isPlayingPreview) {
      stopAudio();
      return;
    }

    stopAudio();

    if (!formData.greeting_text) {
      toast.error('Vui lòng nhập câu chào để nghe thử');
      return;
    }

    try {
      setIsPreviewLoading(true);
      const blob = await personaService.generateAdminAudioPreview({
        text: formData.greeting_text,
        voice_uuid: formData.voice_uuid || undefined,
        speed: 1.0,
      });

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setIsPlayingPreview(false);
        setAudioInstance(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setIsPlayingPreview(false);
        setAudioInstance(null);
        URL.revokeObjectURL(url);
        toast.error('Lỗi khi phát âm thanh nghe thử');
      };

      setAudioInstance(audio);
      setIsPlayingPreview(true);
      audio.play();
    } catch (error) {
      console.error('Failed to play preview:', error);
      toast.error('Không thể tạo file nghe thử');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handlePlaySavedAudio = () => {
    if (isPlayingSaved) {
      stopAudio();
      return;
    }

    stopAudio();

    if (!formData.greeting_audio_url) {
      toast.error('Không có audio đã lưu');
      return;
    }

    try {
      const audio = new Audio(formData.greeting_audio_url);

      audio.onended = () => {
        setIsPlayingSaved(false);
        setAudioInstance(null);
      };

      audio.onerror = () => {
        setIsPlayingSaved(false);
        setAudioInstance(null);
        toast.error('Lỗi khi phát âm thanh đã lưu');
      };

      setAudioInstance(audio);
      setIsPlayingSaved(true);
      audio.play();
    } catch (error) {
      console.error('Failed to play saved audio:', error);
      toast.error('Không thể phát âm thanh đã lưu');
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
      fetchPersonas(editingPersona ? currentPage : 1);
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
      const isLastItemOnPage = personas.length === 1 && currentPage > 1;
      fetchPersonas(isLastItemOnPage ? currentPage - 1 : currentPage);
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
            Quản lý các nhân vật cho hệ thống
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
              {/* Vòng tròn hiển thị và tải lên ảnh đại diện */}
              <div className="flex flex-col items-center gap-3 mb-4">
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

                {/* Ô nhập URL ảnh đại diện */}
                <div className="grid gap-1 w-full">
                  <Label
                    htmlFor="avatar_url"
                    className="text-xs text-muted-foreground"
                  >
                    Hoặc nhập đường dẫn ảnh (URL)
                  </Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, avatar_url: e.target.value })
                    }
                    placeholder="https://example.com/avatar.png"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tts_engine">TTS Engine</Label>
                  <select
                    id="tts_engine"
                    value={selectedEngine}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setSelectedEngine(selected);
                      setFormData({
                        ...formData,
                        voice_uuid: '',
                      });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Chọn Engine
                    </option>
                    {engines.map((engine) => (
                      <option key={engine.id} value={engine.code}>
                        {engine.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="voice_uuid">Voice ID</Label>
                  <select
                    id="voice_uuid"
                    value={formData.voice_uuid || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, voice_uuid: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                    disabled={!selectedEngine}
                  >
                    <option value="" disabled>
                      {selectedEngine
                        ? 'Chọn Voice'
                        : 'Vui lòng chọn Engine trước'}
                    </option>
                    {voices
                      .filter((voice) => {
                        const engine = engines.find(
                          (e) => e.id === voice.engine_id
                        );
                        return engine?.code === selectedEngine;
                      })
                      .map((voice) => (
                        <option key={voice.voice_uuid} value={voice.voice_uuid}>
                          {voice.voice_code}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="gender">Giới tính</Label>
                  <select
                    id="gender"
                    value={formData.gender || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Chọn giới tính
                    </option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả về tính cách hoặc vai trò của nhân vật"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="greeting_text">Câu chào </Label>
                <div className="space-y-2">
                  <Input
                    id="greeting_text"
                    value={formData.greeting_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        greeting_text: e.target.value,
                      })
                    }
                    placeholder="VD: Xin chào, tôi có thể giúp gì cho bạn?"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={handlePlayPreview}
                      disabled={isPreviewLoading || !formData.greeting_text}
                    >
                      {isPreviewLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : isPlayingPreview ? (
                        <Square className="w-3 h-3 mr-1 fill-current" />
                      ) : (
                        <Volume2 className="w-3 h-3 mr-1" />
                      )}
                      {isPlayingPreview ? 'Dừng nghe thử' : 'Nghe thử (TTS)'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={handlePlaySavedAudio}
                      disabled={!formData.greeting_audio_url}
                    >
                      {isPlayingSaved ? (
                        <Square className="w-3 h-3 mr-1 fill-current" />
                      ) : (
                        <Volume2 className="w-3 h-3 mr-1" />
                      )}
                      Phát audio đã lưu
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-between items-center w-full">
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
              <div className="flex gap-2">
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
              </div>
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
              <TableHead>Giới tính</TableHead>
              <TableHead>Engine</TableHead>
              <TableHead>Voice ID</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                  <TableCell>
                    <Badge variant="outline">
                      {persona.gender || 'Chưa chọn'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="uppercase font-mono text-xs"
                    >
                      {persona.tts_engine || 'edge_tts'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {persona.voice_code}
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

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Hiển thị{' '}
            <span className="font-semibold">
              {(currentPage - 1) * pageSize + 1}
            </span>{' '}
            đến{' '}
            <span className="font-semibold">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{' '}
            trong tổng số <span className="font-semibold">{totalItems}</span>{' '}
            nhân vật
          </div>
          <div className="flex items-center space-x-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPersonas(1)}
              disabled={currentPage === 1}
              className="hidden sm:inline-flex"
            >
              Trang đầu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPersonas(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Trước
            </Button>
            <div className="text-sm font-medium px-2">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPersonas(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPersonas(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:inline-flex"
            >
              Trang cuối
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
