import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-white/[0.06]",
                className
            )}
        />
    );
}

/** Skeleton for a chat message bubble */
export function ChatMessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
    return (
        <div className={`flex gap-3 ${align === "right" ? "justify-end" : ""}`}>
            {align === "left" && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
            <div className={`space-y-2 ${align === "right" ? "items-end" : ""}`} style={{ maxWidth: "70%" }}>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
                {align === "left" && <Skeleton className="h-4 w-24" />}
            </div>
            {align === "right" && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
        </div>
    );
}

/** Skeleton for a list of chat messages */
export function ChatMessagesSkeleton() {
    return (
        <div className="space-y-6 p-4">
            <ChatMessageSkeleton align="right" />
            <ChatMessageSkeleton align="left" />
            <ChatMessageSkeleton align="right" />
            <ChatMessageSkeleton align="left" />
        </div>
    );
}

/** Skeleton for a conversation item in sidebar */
export function ConversationSkeleton() {
    return (
        <div className="p-3.5 rounded-xl space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2 w-16 mt-1" />
        </div>
    );
}

/** Skeleton for the profile page */
export function ProfileSkeleton() {
    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="h-5 w-32" />
            </div>
            {/* Form fields */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>
            {/* Button */}
            <Skeleton className="h-12 w-full rounded-xl" />
        </div>
    );
}

/** Skeleton for a user row in admin users table */
export function UserRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-white/5">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

/** Skeleton for pilares semaphore cards */
export function PilarCardSkeleton() {
    return (
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 rounded-full" />
                <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    );
}
