import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Server, Globe, DollarSign, Loader2 } from "lucide-react";

const nodeFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  location: z.string().min(2, "Location is required"),
  country: z.string().min(2, "Country is required"),
  countryCode: z.string().length(2, "Country code must be 2 characters"),
  ipAddress: z.string().ip({ version: "v4", message: "Valid IPv4 address required" }),
  port: z.coerce.number().min(1024).max(65535).default(51820),
  ratePerMinute: z.coerce.number().positive("Rate must be positive").default(0.001),
});

type NodeFormValues = z.infer<typeof nodeFormSchema>;

interface NodeOperatorFormProps {
  onSubmit: (data: NodeFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "FR", name: "France" },
  { code: "CH", name: "Switzerland" },
];

export function NodeOperatorForm({ onSubmit, isSubmitting }: NodeOperatorFormProps) {
  const form = useForm<NodeFormValues>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      name: "",
      location: "",
      country: "",
      countryCode: "",
      ipAddress: "",
      port: 51820,
      ratePerMinute: 0.001,
    },
  });

  const handleCountryChange = (code: string) => {
    const country = countries.find((c) => c.code === code);
    if (country) {
      form.setValue("countryCode", country.code);
      form.setValue("country", country.name);
    }
  };

  return (
    <Card data-testid="card-node-operator-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Register VPN Node
        </CardTitle>
        <CardDescription>
          Set up your VPN node to start earning USDC and X4PN tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Node Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My VPN Node"
                        {...field}
                        data-testid="input-node-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCountryChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{getFlagEmoji(country.code)}</span>
                              {country.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / City</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="New York, NY"
                        className="pl-9"
                        {...field}
                        data-testid="input-location"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server IP Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="192.168.1.1"
                        {...field}
                        data-testid="input-ip-address"
                      />
                    </FormControl>
                    <FormDescription>Public IPv4 address</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WireGuard Port</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="51820"
                        {...field}
                        data-testid="input-port"
                      />
                    </FormControl>
                    <FormDescription>Default: 51820</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ratePerMinute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per Minute (USDC)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="0.001"
                        className="pl-9"
                        {...field}
                        data-testid="input-rate"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Competitive rates attract more users. Average: $0.001/min
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-register-node"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Register Node
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
