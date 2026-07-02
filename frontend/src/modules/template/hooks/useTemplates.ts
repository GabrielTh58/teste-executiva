"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { activateTemplate, getTemplates, Template } from '@/modules/template/api';


export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    const fetchTemplates = async () => {
      try {
        const data = await getTemplates();
        if (!ignore) setTemplates(data);
      } catch (error: any) {
        if (ignore) return;
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(
          err.response?.data?.message ||
            "Erro ao carregar templates. Tente novamente.",
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchTemplates();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  async function handleActivate(template: Template) {
    try {
      await activateTemplate(template.id);
      toast.success("Template ativado com sucesso!");
      refetch();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ||
          "Erro ao ativar template. Tente novamente.",
      );
    }
  }

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  }, []);

  return { templates, loading, refetch, handleActivate };
}
