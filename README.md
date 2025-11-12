# e-Disciplinas RAG USP

e-Disciplinas RAG USP é uma extensão para navegadores Chromium que captura todos os arquivos de um curso no Moodle da USP e os salva em uma estrutura organizada para fluxos de Retrieval-Augmented Generation (RAG). A experiência é totalmente localizada em português, com feedback visual no pop-up e notificações nativas que acompanham cada etapa do download.

## Recursos Principais
- **Download inteligente em um clique** com detecção automática da disciplina, filtro por extensões autorizadas e estados traduzidos (carregando, concluído, erro).
- **Feedback persistente** por meio de notificações do sistema via `chrome.notifications`, mesmo quando o pop-up fica escondido pela UI do navegador.
- **Fluxo de extração resiliente** que segue redirecionamentos, interpreta páginas intermediárias e resolve recursos `pluginfile.php` do Moodle.
- **Organização personalizável** com diretórios base configuráveis e modelos de nomenclatura que combinam código, nome da disciplina e seções.
- **Sanitização avançada de nomes de arquivos** que preserva extensões originais e remove caracteres bloqueados pelo Chrome.
- **Logs detalhados** no console da página e do service worker para depuração rápida.

## Estrutura do Repositório
```
chrome-extension/
├── background.js        # Service worker que orquestra downloads e notificações
├── content.js           # Coleta links do Moodle e solicita o download de cada recurso
├── popup.{html,css,js}  # Interface principal de disparo e feedback de progresso
├── settings.{html,css,js} # Página de configurações com preferências e templates
└── manifest.json        # Configuração do Manifest V3

README.md                # Este guia
CHANGELOG.md             # Histórico de versões
```

## Como instalar
1. Abra `chrome://extensions/` em um navegador baseado em Chromium (Chrome, Edge, Brave).
2. Ative o **Modo desenvolvedor** usando o controle no canto superior direito.
3. Clique em **Carregar sem compactação** e selecione a pasta `chrome-extension` deste repositório.
4. Confirme que o card "e-Disciplinas RAG USP" aparece e o ícone fica visível na barra de ferramentas.
5. Acesse uma página de curso no e-Disciplinas e pressione **Baixar arquivos da disciplina** no pop-up. Os arquivos são salvos, por padrão, em `~/Downloads/e-Disciplinas/<Código>/`.

### Atualizando a extensão
Ao alterar o código, retorne para `chrome://extensions/` e clique em **Atualizar (↻)** no card da extensão. Caso o Chrome reporte algum erro após uma atualização, remova e carregue a pasta novamente.

## Configuração e organização
- Abra o pop-up e clique em **Configurações** (ou selecione **Opções** no card da extensão) para acessar a página dedicada.
- Defina o **Diretório de download** relativo à pasta padrão de Downloads (exemplos: `e-Disciplinas`, `cursos/2026`, ou `.` para salvar diretamente em Downloads).
- Escolha o **modelo de organização** na seção "Organização de arquivos" para combinar código da disciplina, nome da disciplina e seções do Moodle.
- Liste as **Extensões permitidas** separadas por vírgula para controlar quais arquivos serão baixados (ex.: `pdf, txt, md`).
- As preferências permanecem salvas via Chrome Storage API; use **Resetar padrão** para restaurar os valores originais.

O caminho final de download segue o modelo selecionado, por exemplo:
```
~/Downloads/<diretório personalizado>/<código>/<arquivo>.<extensão>
```
Se nenhum código for detectado, o segmento correspondente é omitido automaticamente.

## Como os downloads funcionam
1. O **content script** identifica links de recursos (`a.aalink.stretched-link`) em cada curso e coleta os URLs intermediários.
2. Cada URL passa por uma estratégia de extração em nove etapas que segue redirecionamentos, lê tags HTML e busca arquivos `pluginfile.php`.
3. As correspondências válidas são normalizadas para preservar extensões e remover parâmetros desnecessários.
4. O **service worker** carrega as preferências salvas, monta o caminho final e chama `chrome.downloads.download`.
5. O pop-up atualiza o botão principal com estados como "Baixando..." e "Download concluído" conforme o progresso recebido.
6. Notificações nativas sinalizam início, sucesso ou erro para que o usuário acompanhe o processo mesmo fora do pop-up.
7. Logs com os prefixos `[e-Disciplinas]` (página) e `[e-Disciplinas BG]` (background) ajudam na depuração.

## Solução de problemas
1. Abra o DevTools (**F12**) na página do curso e acompanhe as mensagens `[e-Disciplinas]` no console para entender quais estratégias foram acionadas.
2. Em `chrome://extensions/`, clique em **Service worker** na extensão e observe os logs `[e-Disciplinas BG]` sobre caminhos de arquivos e respostas do Chrome.
3. Problemas comuns:
   - **"Nenhum arquivo encontrado"** – verifique se você está em uma página de curso que contenha recursos com a marcação `aalink` do Moodle.
   - **"Não foi possível encontrar o arquivo"** – a página retornou uma estrutura HTML inesperada ou exige autenticação adicional; capture o trecho exibido nos logs para análise.
   - **Mensagens de timeout** – respostas lentas excederam o limite de 8 segundos; tente novamente ou confira a conexão.
   - **Erros de nome inválido** – confirme que você está usando a versão 1.3.0 ou superior, que aplica sanitização e modelos atualizados.
4. Para mais detalhes, execute `await window.edisciplinasDebugFiles();` no console da página do curso e inspecione os URLs detectados.

## Dicas de desenvolvimento
- Mantenha o DevTools aberto durante o desenvolvimento para acompanhar logs em tempo real dos scripts de conteúdo e background.
- Antes de abrir um PR, atualize o changelog descrevendo as mudanças relevantes de comportamento.
