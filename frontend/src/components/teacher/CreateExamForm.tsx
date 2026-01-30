// src/components/teacher/CreateExamForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

export const CreateExamForm: React.FC = () => {
  const { register, handleSubmit, watch } = useForm();
  const sensitivity = watch("config.sensitivity_level", "standard");

  const sensitivityDescriptions = {
    lenient: "Разрешает короткие отводы взгляда. Идеально для открытых книг.",
    standard: "Баланс. Фиксирует частые повороты головы и потерю лица.",
    strict: "Нулевая толерантность. Любой отвод взгляда > 2 сек — нарушение."
  };

  const onSubmit = (data: any) => {
    // API call to create exam
    console.log("Creating exam:", data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Создание Экзамена</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Базовые поля пропустим для краткости (Title, Duration...) */}
        
        {/* --- Секция Настроек Прокторинга --- */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-700">Настройки AI-Проктора</h3>
          
          {/* Slider Чувствительности */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Уровень строгости</label>
            <div className="flex items-center space-x-4 mt-2">
              {['lenient', 'standard', 'strict'].map((level) => (
                <label key={level} className={`
                  cursor-pointer px-4 py-2 rounded-lg border 
                  ${sensitivity === level ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'}
                `}>
                  <input 
                    type="radio" 
                    value={level} 
                    {...register("config.sensitivity_level")} 
                    className="sr-only"
                  />
                  <span className="capitalize font-bold text-gray-800">{level}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500 italic">
              ℹ️ {sensitivityDescriptions[sensitivity as keyof typeof sensitivityDescriptions]}
            </p>
          </div>

          {/* Чекбоксы ограничений */}
          <div className="mt-6 space-y-3">
            <label className="flex items-center">
              <input type="checkbox" {...register("config.block_tab_switching")} className="form-checkbox h-5 w-5 text-blue-600"/>
              <span className="ml-2 text-gray-700">Блокировать уход с вкладки (Tab Switch)</span>
            </label>
            
            <label className="flex items-center">
              <input type="checkbox" {...register("config.require_fullscreen")} className="form-checkbox h-5 w-5 text-blue-600"/>
              <span className="ml-2 text-gray-700">Требовать полный экран</span>
            </label>
          </div>
          
          {/* Инструкции для AI (Prompt Injection) */}
          <div className="mt-4">
             <label className="block text-sm font-medium text-gray-700">Особые инструкции для AI</label>
             <textarea 
                {...register("config.ai_instructions")}
                placeholder="Например: Студентам разрешено использовать бумагу и ручку для расчетов."
                className="w-full mt-1 p-2 border rounded"
                rows={3}
             />
             <p className="text-xs text-gray-400">Это будет добавлено в системный промпт при анализе.</p>
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
          Создать Экзамен
        </button>
      </form>
    </div>
  );
};