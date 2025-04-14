"use client";

import { useRouter } from "next/navigation";
import { FileText, BookOpen } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCreateModal = ({
  isOpen,
  onClose,
}: QuickCreateModalProps) => {
  const router = useRouter();

  const onArbeidskravClick = () => {
    router.push("/teacher/modules/create");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Velg hva du vil opprette</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div
            onClick={onArbeidskravClick}
            className="flex flex-col items-center justify-center p-8 border rounded-lg hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer transition-all group"
          >
            <FileText className="h-12 w-12 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Nytt Arbeidskrav</h3>
            <p className="text-sm text-muted-foreground text-center">
              Opprett et nytt arbeidskrav for studentene
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg opacity-75 cursor-not-allowed">
            <BookOpen className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ny øvelse</h3>
            <p className="text-sm text-muted-foreground text-center">
              Legges til i Kunnskapsbasen, ingen frist, ingen gradering.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 