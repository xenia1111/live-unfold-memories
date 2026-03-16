import { useState, lazy, Suspense } from "react";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/components/HomePage";
import AddTaskDialog from "@/components/AddTaskDialog";
import AuthPage from "@/components/AuthPage";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";

const CalendarPage = lazy(() => import("@/components/CalendarPage"));
const StoryPage = lazy(() => import("@/components/StoryPage"));
const ProfilePage = lazy(() => import("@/components/ProfilePage"));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 rounded-2xl gradient-warm animate-pulse" />
  </div>
);

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
      case "calendar": return <Suspense fallback={<PageFallback />}><CalendarPage tasks={tasks} onUpdateTask={updateTask} onDeleteTask={deleteTask} /></Suspense>;
      case "story": return <Suspense fallback={<PageFallback />}><StoryPage tasks={tasks} /></Suspense>;
      case "profile": return <Suspense fallback={<PageFallback />}><ProfilePage tasks={tasks} /></Suspense>;
      default: return <HomePage tasks={tasks} loading={loading} onCompleteTask={completeTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
      {activeTab === "home" && <AddTaskDialog onAdd={addTask} />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
