"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, FileCode } from "lucide-react";

interface TechnicalVisualizerProps {
  message: string;
}

export function TechnicalVisualizer({ message }: TechnicalVisualizerProps) {
  const [codeSnippet, setCodeSnippet] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("python");
  const [questionType, setQuestionType] = useState<string | null>(null);

  useEffect(() => {
    // Process message to identify question type and extract code snippets if any
    const detectQuestionType = () => {
      const message_lower = message.toLowerCase();
      
      // Check for DSA questions
      if (message_lower.includes("array") || message_lower.includes("linked list") || 
          message_lower.includes("tree") || message_lower.includes("graph") || 
          message_lower.includes("hash") || message_lower.includes("stack") || 
          message_lower.includes("queue")) {
        setQuestionType("dsa");
        generateDSACode(message);
        return;
      }
      
      // Check for LeetCode questions
      if (message_lower.includes("leetcode") || message_lower.includes("two sum") || 
          message_lower.includes("algorithm") || message_lower.includes("complexity")) {
        setQuestionType("leetcode");
        generateLeetCodeSolution(message);
        return;
      }
      
      // Check for System Design questions
      if (message_lower.includes("system design") || message_lower.includes("architecture") || 
          message_lower.includes("scalability") || message_lower.includes("microservice")) {
        setQuestionType("system_design");
        return;
      }
      
      // Check for OOP questions
      if (message_lower.includes("oop") || message_lower.includes("inheritance") || 
          message_lower.includes("polymorphism") || message_lower.includes("encapsulation") ||
          message_lower.includes("abstraction") || message_lower.includes("interface") || 
          message_lower.includes("class")) {
        setQuestionType("oop");
        generateOOPExample(message);
        return;
      }
      
      // If no specific type identified
      setQuestionType(null);
    };
    
    detectQuestionType();
  }, [message]);
  
  const generateDSACode = (question: string) => {
    const question_lower = question.toLowerCase();
    let code = "";
    
    // Generate appropriate code examples based on the question
    if (question_lower.includes("array") && question_lower.includes("linked list")) {
      code = `# Array implementation
array = [1, 2, 3, 4, 5]
# O(1) access time
element = array[2]  # Immediate access to 3rd element

# Linked List implementation
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    
    def append(self, value):
        if not self.head:
            self.head = Node(value)
            return
        
        current = self.head
        while current.next:
            current = current.next
        current.next = Node(value)
    
    def get(self, index):
        # O(n) access time
        if not self.head:
            return None
        
        current = self.head
        count = 0
        
        while current and count < index:
            current = current.next
            count += 1
        
        return current.value if current else None
`;
    } else if (question_lower.includes("binary tree") && question_lower.includes("balanced")) {
      code = `# Check if a binary tree is balanced
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def is_balanced(root):
    # Function to check if binary tree is height-balanced
    
    def height(node):
        if not node:
            return 0
        
        left_height = height(node.left)
        if left_height == -1:
            return -1
        
        right_height = height(node.right)
        if right_height == -1:
            return -1
        
        # If height difference is more than 1, tree is not balanced
        if abs(left_height - right_height) > 1:
            return -1
        
        # Return height of current subtree
        return max(left_height, right_height) + 1
    
    return height(root) != -1
`;
    }
    
    setCodeSnippet(code);
  };
  
  const generateLeetCodeSolution = (question: string) => {
    const question_lower = question.toLowerCase();
    let code = "";
    
    if (question_lower.includes("two sum")) {
      code = `# Two Sum - LeetCode Solution
# Given an array of integers nums and an integer target, 
# return indices of the two numbers such that they add up to target.

def twoSum(nums, target):
    # Time Complexity: O(n)
    # Space Complexity: O(n)
    
    # Create a hash map to store values and their indices
    num_map = {}
    
    # Iterate through the array
    for i, num in enumerate(nums):
        # Calculate the complement (what we need to find)
        complement = target - num
        
        # Check if complement exists in our map
        if complement in num_map:
            # Return the indices of the two numbers
            return [num_map[complement], i]
        
        # Add current number and its index to the map
        num_map[num] = i
    
    # If no solution is found
    return []

# Example usage
nums = [2, 7, 11, 15]
target = 9
print(twoSum(nums, target))  # Output: [0, 1]
`;
    }
    
    setCodeSnippet(code);
  };
  
  const generateOOPExample = (question: string) => {
    const question_lower = question.toLowerCase();
    let code = "";
    
    if (question_lower.includes("inheritance") && question_lower.includes("composition")) {
      code = `# Inheritance Example
class Vehicle:
    def __init__(self, make, model, year):
        self.make = make
        self.model = model
        self.year = year
    
    def drive(self):
        return f"Driving {self.make} {self.model}"

# Car inherits from Vehicle
class Car(Vehicle):
    def __init__(self, make, model, year, fuel_type):
        super().__init__(make, model, year)
        self.fuel_type = fuel_type
    
    def refuel(self):
        return f"Refueling {self.make} with {self.fuel_type}"

# Composition Example
class Engine:
    def __init__(self, cylinders, horsepower):
        self.cylinders = cylinders
        self.horsepower = horsepower
    
    def start(self):
        return f"Engine with {self.cylinders} cylinders started"

class Vehicle:
    def __init__(self, make, model, year):
        self.make = make
        self.model = model
        self.year = year
        # Composition: Vehicle HAS-A Engine
        self.engine = None
    
    def add_engine(self, engine):
        self.engine = engine
    
    def drive(self):
        if self.engine:
            return f"Driving {self.make} {self.model} with {self.engine.horsepower}hp"
        return f"Can't drive without an engine"
`;
    }
    
    setCodeSnippet(code);
  };

  // If no technical question is detected, don't render the component
  if (!questionType || !codeSnippet) {
    return null;
  }

  return (
    <Card className="mt-4 overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="code">
          <TabsList className="w-full rounded-none bg-muted/60">
            <TabsTrigger value="code" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Sample Code
            </TabsTrigger>
            <TabsTrigger value="syntax" className="flex items-center">
              <FileCode className="h-4 w-4 mr-2" />
              Syntax Reference
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="p-4">
            <div className="flex justify-end mb-2 space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={language === "python" ? "bg-primary text-primary-foreground" : ""}
                onClick={() => setLanguage("python")}
              >
                Python
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={language === "typescript" ? "bg-primary text-primary-foreground" : ""}
                onClick={() => setLanguage("typescript")}
              >
                TypeScript
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={language === "java" ? "bg-primary text-primary-foreground" : ""}
                onClick={() => setLanguage("java")}
              >
                Java
              </Button>
            </div>
            
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
              <code>{codeSnippet}</code>
            </pre>
          </TabsContent>
          
          <TabsContent value="syntax" className="p-4">
            <div className="text-sm">
              {questionType === "dsa" && (
                <div>
                  <h3 className="font-medium mb-2">Data Structure Complexity</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Array:</strong> Access O(1), Search O(n), Insert/Delete O(n)</li>
                    <li><strong>Linked List:</strong> Access O(n), Search O(n), Insert/Delete O(1)</li>
                    <li><strong>Hash Map:</strong> Access/Insert/Delete/Search Average O(1)</li>
                    <li><strong>Binary Search Tree:</strong> Access/Search/Insert/Delete Average O(log n)</li>
                  </ul>
                </div>
              )}
              
              {questionType === "leetcode" && (
                <div>
                  <h3 className="font-medium mb-2">Common Algorithm Patterns</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Two Pointers:</strong> Use two pointers to traverse data (often from opposite ends)</li>
                    <li><strong>Sliding Window:</strong> Maintain a subset of elements as window</li>
                    <li><strong>Binary Search:</strong> Divide and conquer on sorted arrays</li>
                    <li><strong>Hash Map:</strong> Use for O(1) lookups and tracking frequencies</li>
                    <li><strong>Dynamic Programming:</strong> Break problems into overlapping subproblems</li>
                  </ul>
                </div>
              )}
              
              {questionType === "oop" && (
                <div>
                  <h3 className="font-medium mb-2">OOP Principles</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Encapsulation:</strong> Bundling data and methods together, hiding internal state</li>
                    <li><strong>Inheritance:</strong> Creating new classes from existing ones (IS-A relationship)</li>
                    <li><strong>Polymorphism:</strong> Objects taking different forms depending on context</li>
                    <li><strong>Abstraction:</strong> Hiding complexity by exposing only relevant details</li>
                    <li><strong>Composition:</strong> Building objects from other objects (HAS-A relationship)</li>
                  </ul>
                </div>
              )}
              
              {questionType === "system_design" && (
                <div>
                  <h3 className="font-medium mb-2">System Design Principles</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Scalability:</strong> Horizontal (more machines) vs Vertical (bigger machines)</li>
                    <li><strong>Availability:</strong> System uptime, often measured in nines (99.9%, 99.99%)</li>
                    <li><strong>Reliability:</strong> System performs correctly even during failures</li>
                    <li><strong>Load Balancing:</strong> Distributing traffic across multiple servers</li>
                    <li><strong>Caching:</strong> Storing frequently accessed data for quick retrieval</li>
                    <li><strong>Database Sharding:</strong> Horizontal partitioning of data across multiple databases</li>
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 