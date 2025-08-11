'use client';

export default function DebugColorsPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Color Debug Page</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">CSS Variables Test</h2>
        <div className="p-4 border" style={{ backgroundColor: 'hsl(var(--background))' }}>
          Background: hsl(var(--background))
        </div>
        <div className="p-4 border" style={{ backgroundColor: 'hsl(var(--primary))' }}>
          Primary: hsl(var(--primary))
        </div>
        <div className="p-4 border" style={{ backgroundColor: 'hsl(var(--accent))' }}>
          Accent: hsl(var(--accent))
        </div>
        <div className="p-4 border" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
          Secondary: hsl(var(--secondary))
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Button Variants Test</h2>
        <div className="space-x-2">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Default</button>
          <button className="border border-input bg-background px-4 py-2 rounded">Outline</button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded">Secondary</button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Raw CSS Variables</h2>
        <div className="font-mono text-sm space-y-1">
          <div>--background: <span id="bg-value"></span></div>
          <div>--primary: <span id="primary-value"></span></div>
          <div>--accent: <span id="accent-value"></span></div>
          <div>--secondary: <span id="secondary-value"></span></div>
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            
            document.getElementById('bg-value').textContent = computedStyle.getPropertyValue('--background');
            document.getElementById('primary-value').textContent = computedStyle.getPropertyValue('--primary');
            document.getElementById('accent-value').textContent = computedStyle.getPropertyValue('--accent');
            document.getElementById('secondary-value').textContent = computedStyle.getPropertyValue('--secondary');
          });
        `
      }} />
    </div>
  );
}