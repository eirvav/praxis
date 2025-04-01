'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  {
    name: "Week 1",
    total: 85,
  },
  {
    name: "Week 2",
    total: 92,
  },
  {
    name: "Week 3",
    total: 78,
  },
  {
    name: "Week 4",
    total: 88,
  },
];

export const ModuleStatistics = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Bar
                    dataKey="total"
                    fill="#4f46e5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Students</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Score</span>
                <span className="font-medium">85.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Time Spent</span>
                <span className="font-medium">45 mins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 