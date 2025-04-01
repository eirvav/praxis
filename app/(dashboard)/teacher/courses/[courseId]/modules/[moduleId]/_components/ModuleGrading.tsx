'use client';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const DUMMY_DATA = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    submittedAt: "2024-03-15",
    grade: 85,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    submittedAt: "2024-03-14",
    grade: 92,
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    submittedAt: "2024-03-13",
    grade: 78,
  },
];

export const ModuleGrading = () => {
  const [students, setStudents] = useState(DUMMY_DATA);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingGrade, setEditingGrade] = useState<string>("");

  const handleEditGrade = (student: typeof DUMMY_DATA[0]) => {
    setEditingId(student.id);
    setEditingGrade(student.grade.toString());
  };

  const handleSaveGrade = (studentId: number) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          grade: parseInt(editingGrade) || student.grade
        };
      }
      return student;
    }));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{new Date(student.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {editingId === student.id ? (
                    <Input
                      type="number"
                      value={editingGrade}
                      onChange={(e) => setEditingGrade(e.target.value)}
                      className="w-20"
                      min="0"
                      max="100"
                    />
                  ) : (
                    `${student.grade}%`
                  )}
                </TableCell>
                <TableCell>
                  {editingId === student.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveGrade(student.id)}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGrade(student)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 