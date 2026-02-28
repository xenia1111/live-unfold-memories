import { useState } from "react";
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
  date: Date;
  category: string;
  coverImage?: string;
  completionPhoto?: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleAddTask = (task: { title: string; time: string; icon: string; category: string; date: Date; coverImage?: string }) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...task,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "home": return <HomePage extraTasks={tasks} onTasksChange={setTasks} />;
      case "calendar": return <CalendarPage />;
      case "story": return <StoryPage />;
      case "profile": return <ProfilePage />;
      default: return <HomePage extraTasks={tasks} onTasksChange={setTasks} />;
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
