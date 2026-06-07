"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Box, Activity, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/ui/navbar";
import { ANALYSIS_STORAGE_KEY, SESSION_STORAGE_KEY } from "@/lib/constants";
import { getDemoInventory, getDemoAnalysisResult } from "@/lib/demo-data";

export default function Home() {
  const router = useRouter();

  const handleStartAnalysis = () => {
    router.push("/upload");
  };

  const handleViewDemo = () => {
    // Inject realistic demo data into localStorage
    const demoInventory = getDemoInventory();
    const demoResults = getDemoAnalysisResult();

    localStorage.setItem(SESSION_STORAGE_KEY, "demo-session-001");
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(demoResults));
    // Also store demo inventory so /inventory works
    localStorage.setItem("demo_inventory", JSON.stringify(demoInventory));

    router.push("/results");
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm glass border-white/10">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              System Intelligence V1.0 is live
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Understand your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400">
                enterprise landscape
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              AI-powered document analysis that automatically maps your IT systems, traces data flows, and surfaces actionable automation opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base"
                onClick={handleStartAnalysis}
              >
                Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 h-12 px-8 text-base bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                onClick={handleViewDemo}
              >
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          <Card className="hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                <Box className="h-6 w-6 text-blue-400" />
              </div>
              <CardTitle className="text-xl">System Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatically extract and categorize software components, databases, and APIs from your technical documentation.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Network className="h-6 w-6 text-emerald-400" />
              </div>
              <CardTitle className="text-xl">Data Flows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Map complex integrations and data movement across your organization with interactive visualizations.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] lg:col-span-1 md:col-span-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-xl">Automation Intel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Identify bottlenecks and surface high-ROI automation opportunities backed by system metrics.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
