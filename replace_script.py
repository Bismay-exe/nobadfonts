import os

file_path = r'c:\Users\bisma\OneDrive\Desktop\TimePass Projects\xyz\src\pages\FontDetails.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{(['woff2', 'woff', 'ttf', 'otf'] as const).map(format => {"
end_marker = "                                        })}"

start_index = content.find(start_marker)
if start_index == -1:
    print("Start marker not found!")
    exit(1)

# Find the matching closing brace/paren for the map
# Using indentation based end marker might be risky if I have multiple maps.
# But looking at the file, this is unique enough with the indentation.
# The end marker in the file viewed was:
# "                                        })"  (lines 1320 + 1319 indent)
# Let's search for the end of the block.

# Finding end index
end_index = content.find(end_marker, start_index)
if end_index == -1:
    print("End marker not found!")
    # debugging
    print("Content snippet around start:")
    print(content[start_index:start_index+200])
    exit(1)

# Include the end marker in replacement?
# The end marker is `                                        })}`?
# View file says line 1320 is: `                                        })}`
# So yes.

full_end_index = end_index + len(end_marker)

new_content = """{(['woff2', 'woff', 'ttf', 'otf'] as const).map(format => {
                                            const urlKey = `${format}_url` as keyof typeof variant;
                                            const url = variant[urlKey];

                                            // Check for staged changes
                                            const staged = stagedChanges.find(c => c.variantId === variant.id && c.format === format);
                                            const isPendingDelete = staged?.action === 'delete';
                                            const isPendingUpload = staged?.action === 'replace'; // or upload

                                            // Effective state: if staged delete, act as if empty (but show indication). If staged upload, act as if filled (green).
                                            
                                            // 1. Show as Filled if (url AND not pending delete) OR (pending upload)
                                            const showAsFilled = (url && !isPendingDelete) || isPendingUpload;
                                            
                                            return (
                                                <div key={format} className="relative h-24">
                                                    {showAsFilled ? (
                                                        <div className={`absolute inset-0 z-0 border-2 rounded-xl flex flex-col items-center justify-center group overflow-hidden ${
                                                            isPendingUpload 
                                                                ? 'bg-yellow-50 border-yellow-300 transition-colors' 
                                                                : 'bg-green-100 border-green-300 transition-colors'
                                                        }`}>
                                                            <span className={`font-bold text-lg ${isPendingUpload ? 'text-yellow-800' : 'text-green-800'}`}>{format.toUpperCase()}</span>
                                                            <span className={`text-[10px] uppercase font-bold mt-1 ${isPendingUpload ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {isPendingUpload ? (staged?.file ? 'Pending Save' : 'Modified') : 'Installed'}
                                                            </span>
                                                            
                                                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span className="text-white font-bold text-xs uppercase mb-2">Replace</span>
                                                            </div>
                                                            
                                                            <input
                                                                type="file"
                                                                accept={`.${format}`}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleStageChange('replace', format, file, variant.id, variant.variant_name);
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                title="Drag & Drop to Replace"
                                                            />

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); 
                                                                    handleStageChange('delete', format, undefined, variant.id, variant.variant_name);
                                                                }}
                                                                className="absolute top-1 right-1 z-20 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                                                title="Remove File"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className={`absolute inset-0 relative group ${isPendingDelete ? 'opacity-50' : ''}`}>
                                                            {isPendingDelete && (
                                                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                                                    <span className="text-red-500 font-bold text-xs bg-white px-2 py-1 rounded shadow transform -rotate-12 border border-red-200">
                                                                        PENDING DELETE
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            <input
                                                                type="file"
                                                                accept={`.${format}`}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleStageChange('replace', format, file, variant.id, variant.variant_name);
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                title="Drag & Drop to Upload"
                                                            />
                                                            <div className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
                                                                isPendingDelete 
                                                                    ? 'border-red-300 bg-red-50' 
                                                                    : 'border-gray-300 bg-gray-50 group-hover:border-black group-hover:bg-white text-gray-400 group-hover:text-black'
                                                            }`}>
                                                                <span className="font-bold text-xs uppercase">{format.toUpperCase()}</span>
                                                                {!isPendingDelete && <Upload size={16} className="mt-1 opacity-50" />}
                                                                
                                                                {isPendingDelete && (
                                                                    <button 
                                                                        onClick={(e) => {
                                                                             e.preventDefault(); e.stopPropagation();
                                                                             // Placeholder
                                                                        }} 
                                                                        className="hidden" 
                                                                    ></button>
                                                                )}
                                                            </div>
                                                            
                                                            {isPendingDelete && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault(); e.stopPropagation();
                                                                        setStagedChanges(prev => prev.filter(c => !(c.variantId === variant.id && c.format === format)));
                                                                    }}
                                                                    className="absolute top-1 right-1 z-30 p-1 bg-gray-500 text-white rounded-full hover:bg-black text-[10px] px-2 pointer-events-auto"
                                                                >
                                                                    UNDO
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}"""

# Apply Indentation to new_content if needed. Actually I hardcoded it above.
# I matched the previous indentation roughly.
# The start marker was indented with 40 spaces.
# My new content uses spaces.

final_content = content[:start_index] + new_content + content[full_end_index:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Successfully replaced content.")
