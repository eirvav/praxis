"use client";

import Link from "next/link";
import { Layers, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CreateFirstModule = () => {
  return (
    <div className="bg-white p-15">
      <div className="text-center space-y-4">
        <Layers className="h-16 w-16 mx-auto text-muted-foreground" />
        <h2 className="text-2xl font-bold">Let's Create Your First Module</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          You've created a course. Now it's time to add learning content with modules.
        </p>
        <div className="pt-4">
          <Link href="/teacher/modules/create">
            <Button 
              size="lg"
              className="bg-primaryStyling text-white hover:bg-indigo-700 cursor-pointer"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Your First Module
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
