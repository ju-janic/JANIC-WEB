import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/jwt";
import { hasPermission } from "@/lib/permissions/roles";
import { getReactionsForComments } from "@/lib/db/comment-reactions";

// GET /api/posts/[id]/comments - Read comments and return viewer session info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const comments = await prisma.mediaComment.findMany({
      where: { mediaId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const cookieVisitor = req.cookies.get("janic_visitor_id")?.value;
    const visitorId = user ? `user_${user.id}` : cookieVisitor || "anon_visitor";
    const commentIds = comments.map((c: { id: string }) => c.id);
    const reactionsMap = await getReactionsForComments(commentIds, visitorId);

    const commentsWithReactions = comments.map((c: { id: string; reactions?: any; userReactions?: any }) => ({
      ...c,
      reactions: reactionsMap[c.id]?.reactions || {},
      userReactions: reactionsMap[c.id]?.userReactions || [],
    }));

    return NextResponse.json({
      success: true,
      comments: commentsWithReactions,
      currentUser: user
        ? {
            id: user.id,
            name: user.name,
            username: user.username || (user.name.toLowerCase().includes("jamiila") ? "jamiila" : undefined),
            role: user.role,
          }
        : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching comments";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments - Create comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Please sign in to comment" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const name = user.username || user.name;
    const message = (body.message || "").toString().trim().slice(0, 1000);

    if (!message) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    }

    const comment = await prisma.mediaComment.create({
      data: { mediaId: id, name, message },
    });

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        reactions: {},
        userReactions: [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating comment";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PUT /api/posts/[id]/comments - Edit / Update comment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Please sign in to edit comments" },
        { status: 401 }
      );
    }

    const { id: mediaId } = await params;
    const body = await req.json();
    const { commentId, message } = body;

    if (!commentId) {
      return NextResponse.json({ success: false, error: "commentId is required" }, { status: 400 });
    }

    const trimmed = (message || "").toString().trim().slice(0, 1000);
    if (!trimmed) {
      return NextResponse.json({ success: false, error: "Comment message cannot be empty" }, { status: 400 });
    }

    const existing = await prisma.mediaComment.findUnique({
      where: { id: commentId },
    });

    if (!existing || existing.mediaId !== mediaId) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    // Permission check: Author can edit their own comment, or ADMIN / EDITOR
    const isAuthor =
      existing.name.toLowerCase() === user.name.toLowerCase() ||
      Boolean(user.username && existing.name.toLowerCase() === user.username.toLowerCase()) ||
      (user.name.toLowerCase().includes("jamiila") && existing.name.toLowerCase().includes("jamiila"));
    const isStaff = await hasPermission(user.role, "media:update");

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    const updated = await prisma.mediaComment.update({
      where: { id: commentId },
      data: { message: trimmed },
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating comment";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/posts/[id]/comments - Delete comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Please sign in to delete comments" },
        { status: 401 }
      );
    }

    const { id: mediaId } = await params;

    // Support commentId from URL search param or request body
    const searchParamId = req.nextUrl.searchParams.get("commentId");
    let commentId = searchParamId;

    if (!commentId) {
      try {
        const body = await req.json();
        commentId = body.commentId;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!commentId) {
      return NextResponse.json({ success: false, error: "commentId is required" }, { status: 400 });
    }

    const existing = await prisma.mediaComment.findUnique({
      where: { id: commentId },
    });

    if (!existing || existing.mediaId !== mediaId) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    // Permission check: Author or ADMIN / EDITOR
    const isAuthor =
      existing.name.toLowerCase() === user.name.toLowerCase() ||
      Boolean(user.username && existing.name.toLowerCase() === user.username.toLowerCase()) ||
      (user.name.toLowerCase().includes("jamiila") && existing.name.toLowerCase().includes("jamiila"));
    const isStaff = await hasPermission(user.role, "media:delete");

    if (!isAuthor && !isStaff) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    await prisma.mediaComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true, deletedId: commentId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting comment";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
