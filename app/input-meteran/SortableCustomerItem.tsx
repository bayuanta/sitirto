import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableCustomerItemProps {
    id: number;
    index: number;
    customer: {
        id: number;
        nama: string;
        no_pelanggan: string;
        area_name?: string;
    };
    onOrderChange?: (id: number, newIndex: number) => void;
}

export function SortableCustomerItem({ id, index, customer, onOrderChange }: SortableCustomerItemProps) {
    const [localValue, setLocalValue] = useState((index + 1).toString());

    // Sync with index changes from outside (drag and drop or other's input)
    useEffect(() => {
        setLocalValue((index + 1).toString());
    }, [index]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    const handleCommit = () => {
        const val = parseInt(localValue);
        if (!isNaN(val) && val > 0 && onOrderChange) {
            onOrderChange(id, val - 1);
        } else {
            setLocalValue((index + 1).toString());
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 px-4 py-2 bg-white border rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 p-1"
            >
                <GripVertical className="h-5 w-5" />
            </button>
            
            <div className="w-12 shrink-0">
                <input 
                    id={`sortable-order-${customer.id}`}
                    name={`sortable-order-${customer.id}`}
                    type="number" 
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleCommit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.currentTarget as HTMLInputElement).blur();
                        }
                    }}
                    // Ensure the drag system doesn't capture keys from this input
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-full h-8 text-center text-[11px] font-black bg-slate-100 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{customer.nama}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{customer.no_pelanggan}</span>
                    {customer.area_name && (
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-sm">
                            {customer.area_name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
