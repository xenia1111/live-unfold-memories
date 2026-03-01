import { useState } from "react";
import { addDays, subDays } from "date-fns";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/components/HomePage";
import CalendarPage from "@/components/CalendarPage";
import StoryPage from "@/components/StoryPage";
import ProfilePage from "@/components/ProfilePage";
import AddTaskDialog from "@/components/AddTaskDialog";

interface Task {
  id: string;
  title: string;
  time: string;
  icon: string;
  completed: boolean;
  date?: Date;
  category: string;
  coverImage?: string;
  completionPhoto?: string;
  deadline?: Date;
}

const generateMockTasks = (): Task[] => {
  const today = new Date();
  return [
    { id: "1", title: "晨跑 30 分钟", time: "07:00", icon: "dumbbell", completed: true, date: subDays(today, 5), category: "运动" },
    { id: "2", title: "阅读《人类简史》", time: "09:00", icon: "book", completed: true, date: subDays(today, 4), category: "学习" },
    { id: "3", title: "和朋友喝咖啡", time: "14:00", icon: "coffee", completed: true, date: subDays(today, 3), category: "社交" },
    { id: "4", title: "听播客学英语", time: "20:00", icon: "music", completed: true, date: subDays(today, 2), category: "学习" },
    { id: "5", title: "健身房力量训练", time: "18:00", icon: "dumbbell", completed: true, date: subDays(today, 1), category: "运动" },
    { id: "6", title: "写日记", time: "22:00", icon: "heart", completed: false, date: today, category: "记录" },
    { id: "7", title: "冥想 15 分钟", time: "07:30", icon: "star", completed: false, date: today, category: "健康" },
    { id: "8", title: "学习 React", time: "10:00", icon: "book", completed: false, date: addDays(today, 1), category: "学习" },
    { id: "9", title: "约朋友看电影", time: "19:00", icon: "heart", completed: false, date: addDays(today, 2), category: "社交" },
    { id: "10", title: "准备周报", time: "09:00", icon: "star", completed: false, date: addDays(today, 3), category: "工作", deadline: addDays(today, 4) },
    { id: "11", title: "瑜伽课", time: "18:00", icon: "dumbbell", completed: false, date: addDays(today, 4), category: "运动" },
    { id: "12", title: "读完一本新书", time: "全天", icon: "book", completed: false, category: "学习", deadline: addDays(today, 7) },
    { id: "13", title: "学吉他", time: "全天", icon: "music", completed: false, category: "娱乐" },
  ];
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [tasks, setTasks] = useState<Task[]>(generateMockTasks);

  const handleAddTask = (task: { title: string; time: string; icon: string; category: string; date?: Date; coverImage?: string; deadline?: Date }) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...task,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleTasksChange = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home": return <HomePage tasks={tasks} onTasksChange={handleTasksChange} />;
      case "calendar": return <CalendarPage tasks={tasks} />;
      case "story": return <StoryPage tasks={tasks} />;
      case "profile": return <ProfilePage />;
      default: return <HomePage tasks={tasks} onTasksChange={handleTasksChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderPage()}
      <AddTaskDialog onAdd={handleAddTask} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
