"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UploadIcon, FileTextIcon, BriefcaseIcon, ChevronDown, ChevronUp, Edit2, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ContextPanelProps {
  onResumeUpdate: (text: string) => void;
  onJobDescriptionUpdate: (text: string) => void;
}

export function ContextPanel({ onResumeUpdate, onJobDescriptionUpdate }: ContextPanelProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [resumeExpanded, setResumeExpanded] = useState(true);
  const [jobExpanded, setJobExpanded] = useState(true);
  const [editingResume, setEditingResume] = useState(false);
  const [editingJob, setEditingJob] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedResume = localStorage.getItem('resume');
    const storedJobDescription = localStorage.getItem('jobDescription');
    
    if (storedResume) {
      setResumeText(storedResume);
      setResumeExpanded(false);
    }
    
    if (storedJobDescription) {
      setJobDescription(storedJobDescription);
      setJobExpanded(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "job") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Check if it's a PDF file
      if (file.type === "application/pdf") {
        // Use FormData to send to our API endpoint
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to extract PDF text");
        }
        
        const data = await response.json();
        
        if (type === "resume") {
          setResumeText(data.text);
          onResumeUpdate(data.text);
          localStorage.setItem('resume', data.text);
          // Auto-collapse after upload
          setResumeExpanded(false);
          setEditingResume(false);
        } else {
          setJobDescription(data.text);
          onJobDescriptionUpdate(data.text);
          localStorage.setItem('jobDescription', data.text);
          // Auto-collapse after upload
          setJobExpanded(false);
          setEditingJob(false);
        }
      } 
      // If it's a text file or markdown
      else if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith(".md")) {
        const text = await file.text();
        if (type === "resume") {
          setResumeText(text);
          onResumeUpdate(text);
          localStorage.setItem('resume', text);
          // Auto-collapse after upload
          setResumeExpanded(false);
          setEditingResume(false);
        } else {
          setJobDescription(text);
          onJobDescriptionUpdate(text);
          localStorage.setItem('jobDescription', text);
          // Auto-collapse after upload
          setJobExpanded(false);
          setEditingJob(false);
        }
      } else {
        toast.error("Please upload a PDF or text file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to process the file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [onResumeUpdate, onJobDescriptionUpdate]);

  const handleTextChange = useCallback((text: string, type: "resume" | "job") => {
    if (type === "resume") {
      setResumeText(text);
      onResumeUpdate(text);
    } else {
      setJobDescription(text);
      onJobDescriptionUpdate(text);
    }
  }, [onResumeUpdate, onJobDescriptionUpdate]);

  const handleSave = useCallback((type: "resume" | "job") => {
    if (type === "resume") {
      setEditingResume(false);
      setResumeExpanded(false);
      localStorage.setItem('resume', resumeText);
      toast.success("Resume saved");
    } else {
      setEditingJob(false);
      setJobExpanded(false);
      localStorage.setItem('jobDescription', jobDescription);
      toast.success("Job description saved");
    }
  }, [resumeText, jobDescription]);

  const clearContext = useCallback((type: "resume" | "job") => {
    if (type === "resume") {
      setResumeText("");
      onResumeUpdate("");
      localStorage.removeItem('resume');
      setEditingResume(false);
      setResumeExpanded(true);
      toast.info("Resume cleared");
    } else {
      setJobDescription("");
      onJobDescriptionUpdate("");
      localStorage.removeItem('jobDescription');
      setEditingJob(false);
      setJobExpanded(true);
      toast.info("Job description cleared");
    }
  }, [onResumeUpdate, onJobDescriptionUpdate]);

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="px-2 py-3">
        <CardTitle className="text-lg flex items-center">
          <FileTextIcon className="h-4 w-4 mr-2" />
          Interview Context
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="w-full mb-3 rounded-none bg-muted/60">
            <TabsTrigger value="resume" className="flex items-center w-1/2 data-[state=active]:bg-background">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Resume
              {resumeText && !resumeExpanded && !editingResume && (
                <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="job" className="flex items-center w-1/2 data-[state=active]:bg-background">
              <BriefcaseIcon className="h-4 w-4 mr-2" />
              Job
              {jobDescription && !jobExpanded && !editingJob && (
                <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="px-3">
            <TabsContent value="resume" className="mt-0">
              <div className="space-y-4">
                {!resumeText ? (
                  <div>
                    <div className="flex items-center">
                      <Input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.txt,.md"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "resume")}
                        disabled={isUploading}
                      />
                      <label htmlFor="resume-upload" className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          asChild 
                          disabled={isUploading}
                        >
                          <span>
                            <UploadIcon className="h-4 w-4 mr-2" />
                            {isUploading ? "Uploading..." : "Upload Resume"}
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    <Textarea
                      placeholder="Paste your resume text here..."
                      className="h-[300px] mt-4 resize-none"
                      value={resumeText}
                      onChange={(e) => handleTextChange(e.target.value, "resume")}
                    />
                  </div>
                ) : (
                  <div className="border rounded-md bg-card">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <span className="font-medium text-sm flex items-center">
                        <FileTextIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Resume
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => clearContext("resume")}
                          title="Clear resume"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        {!editingResume && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingResume(true)}
                            title="Edit resume"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setResumeExpanded(!resumeExpanded)}
                          title={resumeExpanded ? "Collapse" : "Expand"}
                        >
                          {resumeExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {(resumeExpanded || editingResume) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {editingResume ? (
                            <div className="p-3">
                              <Textarea
                                className="h-[300px] mb-3 resize-none"
                                value={resumeText}
                                onChange={(e) => handleTextChange(e.target.value, "resume")}
                              />
                              <Button 
                                onClick={() => handleSave("resume")}
                                className="w-full"
                              >
                                Save Resume
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm">
                              {resumeText}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="job" className="mt-0">
              <div className="space-y-4">
                {!jobDescription ? (
                  <div>
                    <div className="flex items-center">
                      <Input
                        type="file"
                        id="job-upload"
                        accept=".pdf,.txt,.md"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "job")}
                        disabled={isUploading}
                      />
                      <label htmlFor="job-upload" className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          asChild 
                          disabled={isUploading}
                        >
                          <span>
                            <UploadIcon className="h-4 w-4 mr-2" />
                            {isUploading ? "Uploading..." : "Upload Job Description"}
                          </span>
                        </Button>
                      </label>
                    </div>
                    
                    <Textarea
                      placeholder="Paste the job description here..."
                      className="h-[300px] mt-4 resize-none"
                      value={jobDescription}
                      onChange={(e) => handleTextChange(e.target.value, "job")}
                    />
                  </div>
                ) : (
                  <div className="border rounded-md bg-card">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <span className="font-medium text-sm flex items-center">
                        <BriefcaseIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Job Description
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => clearContext("job")}
                          title="Clear job description"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        {!editingJob && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingJob(true)}
                            title="Edit job description"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setJobExpanded(!jobExpanded)}
                          title={jobExpanded ? "Collapse" : "Expand"}
                        >
                          {jobExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {(jobExpanded || editingJob) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {editingJob ? (
                            <div className="p-3">
                              <Textarea
                                className="h-[300px] mb-3 resize-none"
                                value={jobDescription}
                                onChange={(e) => handleTextChange(e.target.value, "job")}
                              />
                              <Button 
                                onClick={() => handleSave("job")}
                                className="w-full"
                              >
                                Save Job Description
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm">
                              {jobDescription}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 