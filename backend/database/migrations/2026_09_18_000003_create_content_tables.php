<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->unsignedSmallInteger('position')->default(0);
            $table->text('summary');
            $table->text('explanation');
            $table->text('exam_style');
            $table->json('pitfalls');
            $table->timestamps();

            $table->unique(['subject_id', 'slug']);
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('topic');
            $table->text('statement');
            $table->json('options');
            $table->unsignedTinyInteger('correct_index');
            $table->text('explanation');
            $table->text('pitfall')->nullable();
            $table->timestamps();

            $table->unique(['lesson_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('subjects');
    }
};
