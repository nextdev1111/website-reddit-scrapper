"use client";
import { createClient } from "@/supabase/client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid"; // Import icons
import { ToastOptions } from "react-hot-toast"; // Import ToastOptions

const toastOptions: ToastOptions = {
  position: "bottom-right", // Set the toast position
};

interface Post {
  title: string;
  description: string;
  uploaded: boolean;
}

export default function Home() {
  const [jsonData, setJsonData] = useState<undefined | string>(undefined);
  const [posts, setPosts] = useState<Post[]>();

  // Initialising a supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!
  );

  const extractPostsFromJson = () => {
    try {
      const parsedData = JSON.parse(jsonData!);
      if (!parsedData || !parsedData.data || !parsedData.data.children) {
        toast("Nothing to be uploaded", {
          icon: "😭",
          ...toastOptions,
        });
        setPosts([]);
        return;
      }

      const extractedPosts: Post[] = parsedData.data.children
        .map((child: any) => {
          if (child.kind === "t3" && child.data) {
            // Assuming 't3' is the post kind
            return {
              title: child.data.title || "No Title",
              description: child.data.selftext || "No Description", // Using markdown description directly for now
              uploaded: false,
            } as Post;
          }
          return null; // Filter out non-post items if any
        })
        .filter((post: null) => post !== null) as Post[]; // Filter out null values and assert type

      setPosts(extractedPosts);
      uploadPostsToSupabase(posts || []);
    } catch (e: any) {
      toast.error(
        "Please upload something. If already uploaded, then unknown error",
        {
          ...toastOptions,
        }
      );
      setPosts([]);
    }
  };

  const uploadPostsToSupabase = async (postsToUpload: Post[]) => {
    if (!postsToUpload || postsToUpload.length === 0) {
      toast("Nothing to be uploaded", { icon: "😭", ...toastOptions });
      return;
    }

    let uploadedCount = 0;

    const toastId = toast.loading(
      `Uploading 0 of ${postsToUpload.length} posts...`,
      { duration: Infinity, ...toastOptions }
    ); // Initial toast

    for (let i = 0; i < postsToUpload.length; i++) {
      const post = postsToUpload[i];

      try {
        const { error } = await supabase
          .from("Posts")
          .insert([{ title: post.title, description: post.description }]);

        if (error) {
          toast.error(`Error uploading post ${i + 1}: ${error.message}`, {
            id: toastId,
            ...toastOptions,
          });
          break; // Stop on error
        } else {
          uploadedCount++;

          // Use the functional form of setPosts to update the state correctly
          setPosts((prevPosts) => {
            const newPosts = [...prevPosts!];
            newPosts[i].uploaded = true;
            return newPosts;
          });

          toast.loading(
            `Uploading ${uploadedCount} of ${postsToUpload.length} posts...`,
            { id: toastId, ...toastOptions }
          ); // Update toast

          if (uploadedCount === postsToUpload.length) {
            toast.success("All posts uploaded successfully!", {
              id: toastId,
              ...toastOptions,
            });

            setJsonData(undefined);
          }
        }
      } catch (e: any) {
        toast.error(`Unknown error uploading post ${i + 1}: ${e.message}`, {
          id: toastId,
          ...toastOptions,
        });
        break; // Stop on error
      }
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <textarea
          placeholder="Please enter your JSON data here..."
          rows={10}
          cols={80}
          value={jsonData ? jsonData : ""}
          onChange={(event) => {
            setJsonData(event.target.value);
          }}
          className="mb-5 w-full max-w-2xl px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {/* prompt: I want to build a button here which sends a callback to the function */}{" "}
        <button
          disabled={!jsonData} // Disable if jsonData is empty
          className="p-2 border border-gray-400 rounded-md shadow-sm hover:bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200"
          onClick={(e) => extractPostsFromJson()}
        >
          Upload
        </button>
        {/* Added container div */}
        <div className="max-w-2xl w-full border border-gray-300 rounded-md p-4 mt-4">
          {posts && posts.length > 0 ? (
            posts.map((post, index) => (
              <div
                key={index}
                className="flex items-center mb-2 border-b border-gray-200 pb-2"
              >
                <div className="flex-shrink-0 mr-4">
                  {" "}
                  {/* Container for icon */}
                  {post.uploaded ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-lg">
                    {post.title.split(" ").slice(0, 10).join(" ") + "..."}{" "}
                    {/* Limit title to 10 words */}
                  </h3>
                  <p className="text-gray-600">
                    {post.description.substring(0, 100) + "..."}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No posts extracted yet.</p>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
