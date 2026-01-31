import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileEdit, Eye, CheckCircle, Lightbulb, PenTool, ClipboardCheck, Send } from "lucide-react";
import ArticleCard from "./ArticleCard";
import GeneratingArticleCard from "./GeneratingArticleCard";

const createPageUrl = (pageName) => `/${pageName}`;

const columns = [
  {
    id: "idea_queue",
    title: "Idea Queue",
    status: "approved_idea", 
    icon: Lightbulb,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-600",
    typingMessages: ["Analyzing trending topics...", "Identifying content gaps...", "Researching keywords..."]
  },
  {
    id: "drafting",
    title: "Drafting",
    status: "draft", 
    icon: PenTool,
    color: "sky",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    iconColor: "text-sky-600",
    typingMessages: ["Generating initial draft...", "Structuring content...", "Adding sections and FAQs..."]
  },
  {
    id: "refinement",
    title: "Refinement",
    status: "in_review", 
    icon: FileEdit,
    color: "indigo",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    iconColor: "text-indigo-600",
    typingMessages: ["Humanizing content...", "Injecting authentic voice...", "Optimizing SEO metadata...", "Checking keyword density...", "Removing AI patterns..."]
  },
  {
    id: "qa_review",
    title: "QA & Review",
    status: "approved", 
    icon: ClipboardCheck,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
    typingMessages: ["Performing quality checks...", "Validating schema...", "Checking compliance...", "Assigning contributor..."]
  },
  {
    id: "publishing",
    title: "Publishing",
    status: "published", 
    icon: Send,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-600",
    typingMessages: ["Preparing for WordPress...", "Final SEO check...", "Publishing to site..."]
  }
];

const statusMap = {
  "idea_queue": "approved_idea",
  "drafting": "draft",
  "refinement": "in_review",
  "qa_review": "approved",
  "publishing": "published"
};

export default function KanbanBoard({ ideas, articles, onStatusChange, isLoading, generatingIdeas = {}, onGenerateArticle, isGenerating, generationQueue = [], onRemoveFromQueue }) {
  const getItemsForColumn = (columnId) => {
    const items = [];

    // Add generating items for this specific column
    Object.entries(generatingIdeas).forEach(([ideaId, data]) => {
      if (data.column === columnId) {
        const idea = ideas.find(i => i.id === ideaId);
        if (idea) {
          const latestStep = data.steps?.[data.steps.length - 1];
          items.push({ 
            ...idea, 
            type: 'generating', 
            generationStep: latestStep,
            sortKey: `generating-${ideaId}`
          });
        }
      }
    });

    if (columnId === "idea_queue") {
      // Add non-generating ideas that are approved
      ideas.forEach(idea => {
        if (!generatingIdeas[idea.id] && idea.status === 'approved') {
          items.push({ ...idea, type: 'idea', sortKey: `idea-${idea.id}` });
        }
      });
    } else {
      // Add articles for this column based on status mapping
      const status = statusMap[columnId];
      if (status) {
        articles.forEach(article => {
          if (article.status === status) {
            items.push({ ...article, type: 'article', sortKey: `article-${article.id}` });
          }
        });
      }
    }
    
    // Sort items so generating ones are at the top
    return items.sort((a, b) => {
      if (a.type === 'generating' && b.type !== 'generating') return -1;
      if (a.type !== 'generating' && b.type === 'generating') return 1;
      return 0;
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const item = [...ideas, ...articles].find(i => i.id === draggableId);
    
    if (!item) return;

    const newColumnId = destination.droppableId;
    const newStatus = statusMap[newColumnId];

    // Only allow status changes for articles and if the new status is valid
    if (item.type === 'article' && newStatus) {
      // Prevent dragging articles backwards in the workflow for now, or if it's the current status
      const currentColumnId = columns.find(col => col.status === item.status)?.id;
      if (currentColumnId === newColumnId) return; 
      
      // Additional check to prevent invalid transitions
      const columnOrder = columns.map(col => col.id);
      const currentColumnIndex = columnOrder.indexOf(currentColumnId);
      const newColumnIndex = columnOrder.indexOf(newColumnId);

      if (newColumnIndex < currentColumnIndex) {
        alert("Moving articles backward is not supported via drag and drop.");
        return;
      }

      onStatusChange(item.id, newStatus);
    } else if (item.type === 'idea' && newColumnId !== 'idea_queue') {
        // Trigger generation if dragging idea to drafting
        if (newColumnId === 'drafting') {
            onGenerateArticle(item);
        } else {
            alert("Drag idea to 'Drafting' to start generation.");
        }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-5 gap-4">
        {columns.map((column, colIndex) => {
          const items = getItemsForColumn(column.id);
          const Icon = column.icon;
          
          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.1 }}
              className="flex flex-col h-full"
            >
              {/* Column Header */}
              <div className={`${column.bgColor} ${column.borderColor} border-2 rounded-xl p-4 mb-3 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${column.iconColor}`} />
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  </div>
                  <span className="bg-white px-2.5 py-1 rounded-full text-sm font-bold text-gray-700 shadow-sm">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-3 p-3 rounded-xl transition-all min-h-[500px] ${
                      snapshot.isDraggingOver
                        ? `${column.bgColor} ring-2 ring-${column.color}-400 ring-opacity-50`
                        : 'bg-gray-50/50'
                    }`}
                  >
                    {items.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm italic">
                        {column.id === 'idea_queue' ? 'No ideas' : 'Drop here'}
                      </div>
                    )}
                    
                    <AnimatePresence mode="sync">
                      {items.map((item, index) => (
                        <Draggable 
                          key={item.sortKey || item.id} 
                          draggableId={item.id} 
                          index={index}
                          isDragDisabled={item.type === 'generating'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {item.type === 'generating' ? (
                                <GeneratingArticleCard
                                  key={`gen-${item.id}`}
                                  idea={item}
                                  generationStep={item.generationStep}
                                  columnColor={column.color}
                                  onClick={() => {}}
                                />
                              ) : (
                                <ArticleCard
                                  key={`card-${item.id}`}
                                  item={item}
                                  isDragging={snapshot.isDragging}
                                  columnColor={column.color}
                                  columnId={column.id}
                                  onGenerate={onGenerateArticle}
                                  hideActions={item.type === 'generating'}
                                  isGenerating={isGenerating}
                                  isInQueue={generationQueue.some(q => q.id === item.id)}
                                  queuePosition={generationQueue.findIndex(q => q.id === item.id) + 1}
                                  onRemoveFromQueue={onRemoveFromQueue}
                                />
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </motion.div>
          );
        })}
      </div>
    </DragDropContext>
  );
}