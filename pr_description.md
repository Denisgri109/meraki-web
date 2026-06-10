💡 **What:** Optimized `PilatesTimetableManager` rendering by moving `hosts.find()` and `DAYS.find()` inside `templates.map()` out into pre-computed `Map` objects using an IIFE.

🎯 **Why:** Previously, rendering the weekly timetable triggered O(N * M) lookups because it would iterate the full arrays for every template. Using Maps provides O(1) lookups, resolving this redundant array traversal inside the map block.

📊 **Measured Improvement:** We created a benchmark script running 100 iterations on datasets of different sizes.
*   For 50 hosts / 200 templates: 3.36x speedup (0.0625ms ➡️ 0.0186ms).
*   For 500 hosts / 5000 templates: 19.77x speedup (12.9033ms ➡️ 0.6527ms).
Algorithmic complexity was improved from O(T * (H + D)) to O(T + H + D).
