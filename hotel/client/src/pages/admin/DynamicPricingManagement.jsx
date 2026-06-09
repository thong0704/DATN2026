import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useListHotelsQuery } from '../../features/hotels/hotelsApi';
import { useRoomsByHotelQuery, useUpdateRoomMutation } from '../../features/rooms/roomsApi';
import {
  useListHolidayPricingQuery,
  useCreateHolidayPricingMutation,
  useUpdateHolidayPricingMutation,
  useDeleteHolidayPricingMutation,
  useApplyAllHolidayPricingMutation,
} from '../../features/holidayPricing/holidayPricingApi';
import Spinner from '../../components/Spinner';
import { formatCurrency, formatDate } from '../../utils/format';

export default function DynamicPricingManagement() {
  const [activeTab, setActiveTab] = useState('holiday'); // 'holiday' | 'weekend'
  const { data: hotelsData, isLoading: hotelsLoading } = useListHotelsQuery();
  const hotels = hotelsData?.data?.hotels || [];
  
  const [selectedHotelId, setSelectedHotelId] = useState('');

  // Auto-select first hotel
  useEffect(() => {
    if (hotels.length && !selectedHotelId) {
      setSelectedHotelId(hotels[0]._id);
    }
  }, [hotels, selectedHotelId]);

  // Holiday Pricing Queries
  const { data: holidayData, isLoading: holidayLoading, refetch: refetchHolidays } = useListHolidayPricingQuery(
    { hotel: selectedHotelId },
    { skip: !selectedHotelId }
  );
  const holidays = holidayData?.data?.holidays || [];
  
  const [createHoliday] = useCreateHolidayPricingMutation();
  const [updateHoliday] = useUpdateHolidayPricingMutation();
  const [deleteHoliday] = useDeleteHolidayPricingMutation();
  const [applyAllHoliday] = useApplyAllHolidayPricingMutation();

  // Weekend Pricing Queries (Rooms)
  const { data: roomsData, isLoading: roomsLoading, refetch: refetchRooms } = useRoomsByHotelQuery(
    selectedHotelId,
    { skip: !selectedHotelId }
  );
  const rooms = roomsData?.data?.rooms || [];
  const [updateRoom] = useUpdateRoomMutation();

  // Holiday Form State
  const [editingHoliday, setEditingHoliday] = useState(null);
  const formDefaults = { name: '', from: '', to: '', multiplier: 1.5, isActive: true };
  const { register, handleSubmit, reset, setValue } = useForm({ defaultValues: formDefaults });

  // Weekend Quick Edit State
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [quickWeekendPrice, setQuickWeekendPrice] = useState('');

  // Apply All toggle
  const [isApplyAll, setIsApplyAll] = useState(false);

  const handleEditHoliday = (h) => {
    setEditingHoliday(h);
    setValue('name', h.name);
    setValue('from', dayjs(h.from).format('YYYY-MM-DD'));
    setValue('to', dayjs(h.to).format('YYYY-MM-DD'));
    setValue('multiplier', h.multiplier);
    setValue('isActive', h.isActive !== false);
  };

  const handleSaveHoliday = async (form) => {
    if (!isApplyAll && !selectedHotelId) {
      toast.error('Vui lòng chọn khách sạn');
      return;
    }

    const payload = {
      name: form.name,
      from: form.from,
      to: form.to,
      multiplier: Number(form.multiplier) || 1.5,
      isActive: !!form.isActive,
    };

    try {
      if (editingHoliday) {
        await updateHoliday({ id: editingHoliday._id, ...payload, hotel: selectedHotelId }).unwrap();
        toast.success('Đã cập nhật ngày lễ');
      } else if (isApplyAll) {
        const result = await applyAllHoliday(payload).unwrap();
        toast.success(result.message || `Đã áp dụng cho tất cả khách sạn`);
      } else {
        await createHoliday({ ...payload, hotel: selectedHotelId }).unwrap();
        toast.success('Đã thêm ngày lễ mới');
      }
      reset(formDefaults);
      setEditingHoliday(null);
      setIsApplyAll(false);
      refetchHolidays();
    } catch (e) {
      toast.error(e?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ngày lễ này?')) return;
    try {
      await deleteHoliday(id).unwrap();
      toast.success('Đã xóa thành công');
      refetchHolidays();
    } catch (e) {
      toast.error(e?.data?.message || 'Không thể xóa');
    }
  };

  const startEditRoomWeekend = (room) => {
    setEditingRoomId(room._id);
    setQuickWeekendPrice(room.weekendPrice || '');
  };

  const saveRoomWeekendPrice = async (room) => {
    const priceVal = Number(quickWeekendPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      toast.error('Giá trị không hợp lệ');
      return;
    }
    try {
      await updateRoom({
        id: room._id,
        weekendPrice: priceVal,
      }).unwrap();
      toast.success(`Đã cập nhật giá cuối tuần phòng ${room.roomNumber}`);
      setEditingRoomId(null);
      refetchRooms();
    } catch (e) {
      toast.error(e?.data?.message || 'Lỗi cập nhật');
    }
  };

  if (hotelsLoading) return <Spinner className="py-12" />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 px-6 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">⚡ Quản lý giá động</h1>
              <p className="text-teal-500-100/80 text-sm mt-1">
                Thiết lập hệ số giá ngày lễ, tết và điều chỉnh giá phòng cuối tuần để tối ưu doanh thu.
              </p>
            </div>
            {/* Hotel Selector */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
              <span className="text-sm font-semibold whitespace-nowrap">🏨 Khách sạn:</span>
              <select
                value={selectedHotelId}
                onChange={(e) => {
                  setSelectedHotelId(e.target.value);
                  setEditingHoliday(null);
                  reset(formDefaults);
                }}
                className="bg-transparent font-medium border-none focus:ring-0 text-white text-sm cursor-pointer outline-none min-w-[180px] max-w-[280px]"
              >
                {hotels.map((h) => (
                  <option key={h._id} value={h._id} className="text-gray-900 bg-white">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('holiday')}
          className={`px-5 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'holiday'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          🎉 Giá Ngày Lễ (Multiplier)
        </button>
        <button
          onClick={() => setActiveTab('weekend')}
          className={`px-5 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'weekend'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          📅 Giá Cuối Tuần (Weekend Price)
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'holiday' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <form
            onSubmit={handleSubmit(handleSaveHoliday)}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 h-fit"
          >
            <h2 className="font-bold text-base flex items-center gap-2 pb-2 border-b border-gray-100">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs bg-gradient-to-br ${
                  editingHoliday ? 'from-amber-400 to-orange-500' : 'from-teal-400 to-emerald-600'
                }`}
              >
                {editingHoliday ? '✏' : '+'}
              </span>
              {editingHoliday ? 'Sửa' : 'Thêm'} giá ngày lễ
            </h2>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Tên ngày lễ *</label>
              <input
                placeholder="Ví dụ: Tết Dương Lịch"
                className="input text-sm"
                {...register('name', { required: true })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Từ ngày *</label>
                <input type="date" className="input text-sm" {...register('from', { required: true })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Đến ngày *</label>
                <input type="date" className="input text-sm" {...register('to', { required: true })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Hệ số nhân (Multiplier) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  placeholder="1.5"
                  className="input text-sm pl-3 pr-12"
                  {...register('multiplier', { required: true, min: 1.0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                  x giá gốc
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Ví dụ: 1.5 tức là tăng 50% so với giá gốc.</p>
            </div>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-100">
              <input type="checkbox" className="w-4 h-4 accent-teal-600" {...register('isActive')} />
              <span className="font-semibold text-gray-700">Kích hoạt áp dụng</span>
            </label>

            {/* Apply All Toggle */}
            {!editingHoliday && (
              <label
                className={`flex items-center gap-2.5 text-sm cursor-pointer p-3 rounded-xl border transition-all ${
                  isApplyAll
                    ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-300 ring-1 ring-violet-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-violet-600"
                  checked={isApplyAll}
                  onChange={(e) => setIsApplyAll(e.target.checked)}
                />
                <div>
                  <span className={`font-semibold ${isApplyAll ? 'text-violet-700' : 'text-gray-700'}`}>
                    🏨 Áp dụng cho TẤT CẢ khách sạn
                  </span>
                  {isApplyAll && (
                    <p className="text-[11px] text-violet-500 mt-0.5">Sẽ tạo ngày lễ cho tất cả {hotels.length} khách sạn cùng lúc</p>
                  )}
                </div>
              </label>
            )}

            <button className={`w-full py-2.5 rounded-xl font-bold border-none transition-all ${
              isApplyAll
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white'
                : 'btn-primary bg-teal-600 hover:bg-teal-700'
            }`}>
              {editingHoliday ? '💾 Lưu thay đổi' : isApplyAll ? '🏨 Áp dụng cho tất cả KS' : '✚ Thêm mới'}
            </button>

            {editingHoliday && (
              <button
                type="button"
                onClick={() => {
                  setEditingHoliday(null);
                  reset(formDefaults);
                }}
                className="btn-outline w-full py-2.5 rounded-xl text-sm border-gray-300 hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
            )}
          </form>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            {holidayLoading ? (
              <Spinner className="py-12" />
            ) : holidays.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-gray-500 font-semibold text-sm">Chưa cấu hình ngày lễ nào cho khách sạn này</p>
                <p className="text-xs text-gray-400 mt-1">Cấu hình ngày lễ để tự động nhân giá khi khách book phòng.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase">
                      <th className="px-5 py-4">Tên ngày lễ</th>
                      <th className="px-5 py-4">Thời gian</th>
                      <th className="px-5 py-4 text-center">Hệ số</th>
                      <th className="px-5 py-4 text-center">Trạng thái</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {holidays.map((h) => (
                      <tr key={h._id} className="hover:bg-gray-50/55 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-800">{h.name}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-600 font-mono text-xs">
                          {formatDate(h.from)} → {formatDate(h.to)}
                        </td>
                        <td className="px-5 py-4 text-center font-extrabold text-teal-600 text-base">
                          {h.multiplier}x
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${
                              h.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                            }`}
                          >
                            {h.isActive ? 'Bật' : 'Tắt'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditHoliday(h)}
                              className="text-xs px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-100 transition font-medium"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteHoliday(h._id)}
                              className="text-xs px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition font-medium"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Weekend Pricing */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">Giá phòng cuối tuần (Thứ 6 & Thứ 7)</h3>
              <p className="text-gray-500 text-xs mt-0.5">Đặt giá riêng cho 2 ngày cuối tuần nếu muốn tự động tăng giá.</p>
            </div>
            <button
              onClick={refetchRooms}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
            >
              🔄 Tải lại danh sách
            </button>
          </div>

          {roomsLoading ? (
            <Spinner className="py-12" />
          ) : rooms.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-3">🛏️</p>
              <p className="text-gray-500 font-semibold text-sm">Chưa có phòng nào được tạo cho khách sạn này</p>
              <p className="text-xs text-gray-400 mt-1">Vui lòng sang trang "Quản lý phòng" để tạo phòng trước.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase">
                  <th className="px-5 py-4">Số phòng</th>
                  <th className="px-5 py-4">Loại phòng</th>
                  <th className="px-5 py-4">Giá gốc (Ngày thường)</th>
                  <th className="px-5 py-4">Giá cuối tuần</th>
                  <th className="px-5 py-4 text-right">Điều chỉnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/55 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-800">Phòng {r.roomNumber}</td>
                    <td className="px-5 py-4">
                      <span className="capitalize px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-semibold">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {formatCurrency(r.pricePerNight)}
                    </td>
                    <td className="px-5 py-4">
                      {editingRoomId === r._id ? (
                        <div className="flex items-center gap-1.5 max-w-[160px]">
                          <input
                            type="number"
                            value={quickWeekendPrice}
                            onChange={(e) => setQuickWeekendPrice(e.target.value)}
                            className="input py-1 text-sm font-semibold"
                            placeholder="Nhập giá"
                          />
                        </div>
                      ) : r.weekendPrice ? (
                        <p className="font-bold text-emerald-600">
                          {formatCurrency(r.weekendPrice)}
                          <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1.5">
                            + {Math.round(((r.weekendPrice - r.pricePerNight) / r.pricePerNight) * 100)}%
                          </span>
                        </p>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Áp dụng giá ngày thường</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {editingRoomId === r._id ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => saveRoomWeekendPrice(r)}
                            className="px-2.5 py-1 bg-teal-600 text-white rounded-md text-xs font-semibold hover:bg-teal-700 transition"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingRoomId(null)}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200 transition"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditRoomWeekend(r)}
                          className="text-xs px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 hover:bg-teal-100 transition font-medium"
                        >
                          Thay đổi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
