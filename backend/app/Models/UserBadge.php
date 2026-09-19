<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['earned_at' => 'datetime'];
    }
}
