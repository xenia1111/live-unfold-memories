import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/components/HomePage";
import CalendarPage from "@/components/CalendarPage";
import StoryPage from "@/components/StoryPage";
import ProfilePage from "@/components/ProfilePage";
import AddTaskDialog from "@/components/AddTaskDialog";
import AuthPage from "@/components/AuthPage";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const { tasks, loading, addTask, completeTask, updateTask, deleteTask } = useTasks();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl gradient-warm animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case "home": return <HomePage tasks={tasks} loading={loading} onCompleteTask={completeTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} onNavigateProfile={() => setActiveTab("profile")} />;
      case "calendar": return <CalendarPage tasks={tasks} onUpdateTask={updateTask} onDeleteTask={deleteTask} />;
      case "story": return <StoryPage tasks={tasks} />;
      case "profile": return <ProfilePage tasks={tasks} />;
      default: return <HomePage tasks={tasks} loading={loading} onCompleteTask={completeTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
      <AddTaskDialog onAdd={addTask} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
