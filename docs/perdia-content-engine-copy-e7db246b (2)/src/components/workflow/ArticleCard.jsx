import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const createPageUrl = (pageName) => `/${pageName}`;
import { Calendar, FileText, Zap, Eye, Edit3, CheckCircle2, RefreshCw, FastForward, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ArticleCard({ item, isDragging, columnColor, columnId, onGenerate, isGenerating, isInQueue, queuePosition, onRemoveFromQueue }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (item.type === 'idea') {
      // Generate article on dashboard with animation
      if (onGenerate) {
        onGenerate(item);
      } else {
        navigate(createPageUrl('ArticleWizard') + `?ideaId=${item.id}&auto=true`);
      }
    } else if (item.type === 'article') {
      // Navigate to editor for all article stages to allow fixing/refining
      navigate(createPageUrl('ArticleEditor') + `?id=${item.id}`);
    }
  };

  const getActionIcon = () => {
    if (columnId === 'idea_queue') return <Zap className="w-4 h-4" />;
    if (columnId === 'drafting') return <Edit3 className="w-4 h-4" />;
    if (columnId === 'refinement') return <Edit3 className="w-4 h-4" />;
    if (columnId === 'qa_review') return <CheckCircle2 className="w-4 h-4" />;
    if (columnId === 'publishing') return <Eye className="w-4 h-4" />;
  };

  const getActionText = () => {
    if (columnId === 'idea_queue') return 'Generate';
    if (columnId === 'drafting') return 'Edit Draft';
    if (columnId === 'refinement') return 'Fix Issues';
    if (columnId === 'qa_review') return 'Final QA';
    if (columnId === 'publishing') return 'View';
  };

  return (
    <motion.div
      layoutId={item.type === 'idea' ? `idea-${item.id}` : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ 
        type: "spring",
        stiffness: 500,
        damping: 40
      }}
      onClick={handleClick}
      className={`bg-white rounded-xl p-4 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
        isDragging
          ? 'shadow-2xl rotate-2 ring-4 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
        {item.title}
      </h4>

      {/* Description for ideas */}
      {item.type === 'idea' && item.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Excerpt for articles */}
      {item.type === 'article' && item.excerpt && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {item.excerpt}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {item.type === 'idea' && item.source && (
          <Badge variant="outline" className="text-xs capitalize">
            {item.source}
          </Badge>
        )}
        {item.type === 'article' && item.content_type && (
          <Badge variant="outline" className="text-xs capitalize">
            {item.content_type.replace(/_/g, ' ')}
          </Badge>
        )}
        {item.priority && (
          <Badge
            variant="outline"
            className={`text-xs ${
              item.priority === 'high'
                ? 'bg-red-50 text-red-700 border-red-200'
                : item.priority === 'medium'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {item.priority}
          </Badge>
        )}
        {item.word_count && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            {item.word_count}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {new Date(item.created_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </div>
        {item.type === 'idea' && columnId === 'idea_queue' ? (
          isInQueue ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                In Queue #{queuePosition}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromQueue?.(item.id);
                }}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : isGenerating ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClick}
              className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Clock className="w-3 h-3" />
              Add to Queue
            </Button>
          ) : (
            <div className={`flex items-center gap-1 text-xs font-medium text-${columnColor}-600`}>
              {getActionIcon()}
              {getActionText()}
            </div>
          )
        ) : (
          <div className={`flex items-center gap-1 text-xs font-medium text-${columnColor}-600`}>
            {getActionIcon()}
            {getActionText()}
          </div>
        )}
      </div>


    </motion.div>
  );
}