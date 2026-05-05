import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableCustomerItemProps {
    id: number;
    customer: {
        id: number;
        nama: string;
        no_pelanggan: string;
    };
}

export function SortableCustomerItem({ id, customer }: SortableCustomerItemProps) {
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
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 px-4 py-3 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
            >
                <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1">
                <p className="font-semibold text-sm">{customer.nama}</p>
                <p className="text-xs text-slate-500">{customer.no_pelanggan}</p>
            </div>
        </div>
    );
}
